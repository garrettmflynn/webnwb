import * as visualscript from '../../external/visualscript/index.esm'
import * as NWBCodec from '../../external/freerange/nwb/index'
import * as freerange from '../../external/freerange/index.esm'

import nwb from '../../src/index'
import * as utils from '../utils'
import links from '../links'

// import * as nwb from 'https://cdn.jsdelivr.net/npm/webnwb@latest/dist/index.esm.js'
import NWBHDF5IO from 'src/io'
import { getAssets, getDandisets, getInfo, getInfoURL, getJSON } from 'src/dandi'

let file:string, name:string, io: NWBHDF5IO;


function formatBytes(bytes: number, decimals: number) {
  if(bytes == 0) return '0 Bytes';
  var k = 1024,
      dm = decimals || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


const getSummary = (o: any) => {
  return {
    name: o.name,
    id: o.identifier.split('DANDI:').pop() as string,
    size: formatBytes(o.assetsSummary?.numberOfBytes, 2),
    version: o.version,
    description: o.description
  }
}

const dandi = document.getElementById('dandi') as HTMLSelectElement
const assetSelect = document.getElementById('assets') as HTMLSelectElement
const fromDANDI = document.getElementById('dandiButton') as HTMLSelectElement


let collection: {[x:string]: any} = {}


const loadAsset = () => {
  file = assetSelect.value // URL
  name = assetSelect.innerText.split('/').pop() ?? 'streaming.nwb' // File Name
  if (file && name) runFetch(true)
  else console.error('No dandiset selected')
}

const setAssetOptions = async () => {
  const assets = await getAssets(dandi.value)
  console.log(`Got all assets for ${dandi.value}`, assets)
  const url = `${getInfoURL(dandi.value)}/assets`
  if (assets) {
   const urls = await Promise.all(assets.map(async (o: any) => {
      const assetInfo = await getJSON(`${url}/${o.asset_id}/info`)
      const option = document.createElement('option')
      option.value = assetInfo.metadata.contentUrl[0]
      option.innerHTML = `${assetInfo.path}`
      assetSelect.insertAdjacentElement('beforeend', option)
    }))

    return urls
  } else return null
}

fromDANDI.onclick = loadAsset

dandi.onchange = async () =>{
  setAssetOptions()
  loadAsset()
}

// assetSelect.onchange = async () => loadAsset

getDandisets().then(async dandisets => {

  // Filter drafts
  dandisets = dandisets.filter(o => o.draft_version.status === 'Valid')

  // Display dandisets
  console.log('Got all dandisets', dandisets)
  await Promise.all(dandisets.map(async (o) => {
    const res = getSummary(await getInfo(o.identifier))
    const option = document.createElement('option')
    option.value = res.id
    collection[res.id] = o
    option.innerHTML = `${o.identifier} - ${res.name} (${res.size})`
    dandi.insertAdjacentElement('beforeend', option)
  }))

  setAssetOptions()
})

const fileStreamingCheckbox = document.getElementById('streaming') as HTMLInputElement

// Buttons
const buttons = document.getElementById('buttons') as HTMLButtonElement
const input = document.getElementById('file') as HTMLButtonElement
const get = document.getElementById('get') as HTMLButtonElement
const save = document.getElementById('save') as HTMLButtonElement

// Divs
const display = document.getElementById('display') as HTMLDivElement
const gallery = document.getElementById('gallery') as HTMLDivElement
const plot = document.getElementById('plot') as HTMLDivElement

// Add loader
let loader = new visualscript.Loader({ color: '#7aff80', type: 'linear', text: 'Select a file', showPercent: false, textBackground: 'black', textColor: 'white'})
loader.id = 'loader'
display.insertAdjacentElement('beforeend', loader)

// Add object editor
let editor = new visualscript.ObjectEditor()
// let editor = new visualscript.Tree()
editor.id = 'editor'
display.insertAdjacentElement('afterbegin', editor)

console.log('API', nwb)

io = new nwb.NWBHDF5IO(true)

globalThis.onbeforeunload = () => {
    io.syncFS(false) // Sync IndexedDB
}

for (let type in links) {
const section = document.createElement('div')
const header = document.createElement('h3')
header.innerHTML = type
section.insertAdjacentElement('afterbegin', header)

for (let paperName in links[type]) {
  const paper = document.createElement('div')
  const linkArr = links[type][paperName]

  if (linkArr.length > 1){
    const h4 = document.createElement('h4')
    h4.innerHTML = paperName
    paper.insertAdjacentElement('afterbegin', h4)
  }

  linkArr.forEach((src, i) => {
    const button = document.createElement('button')
    button.classList.add('button')
    button.classList.add('button--secondary')
    // const link = document.createElement('a')
    // link.insertAdjacentElement('beforeend', button)
    // link.src = src

    const displayName = `${(linkArr.length > 1) ? `${paperName.split(' ')[0]} ${i + 1}` : `${paperName}`}`
    button.innerHTML = displayName
    paper.insertAdjacentElement('beforeend', button)
    button.onclick = () => {
      loader.progress = 0
      file = src
      name = `${displayName.replaceAll(/\s+/g, '')}.nwb` // Must change name for new files to request
      runFetch()
    }
  })

  section.insertAdjacentElement('beforeend', paper)
}
buttons.insertAdjacentElement('beforeend', section)

}

async function parseFile(file: any){
loader.progress = 1
plot.innerHTML = ''
gallery.innerHTML = ''

editor.set(file)
console.log('File', file)
// progressDiv.innerHTML = 'Loaded ' + name + '. Check the console for output.'


const acquisition = await file.acquisition

const stimulus = await file.stimulus
const presentation = await stimulus.presentation
// file.acquisition
let key = Object.keys(acquisition)[0]
let stimKey = (presentation) ? Object.keys(presentation)[0] : undefined
const presentationObj = (stimKey) ? await presentation[stimKey] : undefined
const acquisitionObj = await file.acquisition[key]

const lines = []


console.log('Acquisition', acquisition)
console.log('Stimulus', stimulus)
console.log('Presentation', presentation)
console.log('Acquisition Object', acquisitionObj)
console.log('Presentation Object', presentationObj)

// Show Images

const externalFile = await acquisitionObj?.externalFile


if (acquisitionObj && externalFile) {

  let waiter = new visualscript.Loader({ showPercent: false })
  waiter.id = 'waiter'
  plot.insertAdjacentElement('beforeend', waiter)

  function createImg(src: string) {
    return new Promise(resolve => {
      // Create an Image object
      var img = new Image();
      // Add CORS approval to prevent a tainted canvas
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        resolve(img);
      };
      // Load the image
      img.src = src;
      // make sure the load event fires for cached images too
      if (img.complete || img.complete === undefined) {
        // Flush cache
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
        // Try again
        img.src = src;
      }
    })

  }

  const arr = await Promise.all(externalFile.map(createImg))


  arr.forEach(o => {
    gallery.insertAdjacentElement('beforeend', o)
  })

  waiter.remove()
  waiter = undefined
}

// Show TimeSeries
else {

  const dataValue = await acquisitionObj.data

  if (dataValue) lines.push({
    name: 'Acquisition',
    x: (await acquisitionObj?.timestamps) ?? Array.from({ length: dataValue.length }, (_, i) => i),
    y: dataValue
  })

  else console.error('No data value...')
}


// Show Stimulus
if (presentationObj) {
  const data = await presentationObj.data
  lines.push({
    name: 'Stimulus',
    x: await presentationObj.timestamps ?? Array.from({ length: data.length }, (_, i) => i),
    y: data,
    yaxis: 'y2',
    opacity: 0.5,
  })
}

if (lines.length > 0) Plotly.newPlot(plot, lines, {
  title: key ?? stimKey,
  margin: { t: 0 },
  yaxis: { title: 'Acquisition' },
  yaxis2: {
    title: 'Stimulus',
    titlefont: { color: 'rgb(148, 103, 189)' },
    tickfont: { color: 'rgb(148, 103, 189)' },
    overlaying: 'y',
    side: 'right'
  }
});
}

function runFetch(useStreaming = fileStreamingCheckbox?.checked) {

io.fetch(
  file, 
  name, 
  {
    progressCallback: (ratio, length, id) => {
      loader.progress = ratio
      loader.text = `${utils.formatBytes(ratio * length, 2)} of ${utils.formatBytes(length, 2)} downloaded.`
    }, 
    successCallback: (fromRemote, id) => { 
      if (!fromRemote) loader.text = 'File loaded from local storage.'
    },
    useStreaming
  }
)
.then(async (file) => {
  parseFile(file)
})
}


let filesystem: any = null
let nwbFile: any = null

// 2. Allow User to Load their own NWB File
input.onclick = async (ev) => {

  filesystem = new freerange.System(undefined, {
    debug: true,
    ignore: ['DS_Store'],
    codecs: { nwb: NWBCodec }
  })

  // system.progress = globalProgressCallback
  await filesystem.init()
  // const f = await filesystem.open()

  nwbFile = filesystem.files.types.nwb[0]
  if (nwbFile){
    name = nwbFile.name
    const body = await nwbFile.body
    console.log('File', body)
    name = nwbFile.name

    // io = new nwb.NWBHDF5IO(true)

    // name = ev.target.files[0].name
    // await io.upload(ev)
    // let file = io.read(name)
    // console.log('File', file)
    parseFile(body)
  } else console.error('No NWB files in this directory.')
}

save.onclick = () => {
  if (nwbFile) {
    io.save(name)
    nwbFile.save() // restrict experimentation to one file
  }
}


// 3. Allow User to Download an NWB File off the Browser
get.onclick = async () => {
  if (io) {
    io.save(name) // save current object edits
    io.download(name)
  }
}
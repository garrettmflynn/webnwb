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


function formatBytes(bytes: number, decimals: number = 2) {
  if(bytes == 0) return '0 Bytes';
  var k = 1024,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
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
const sampleButton = document.getElementById('sampleButton') as HTMLSelectElement
const dandiStatus = document.getElementById('dandiStatus') as HTMLSpanElement
const dandiDiv = document.getElementById('dandiDiv') as HTMLDivElement


let collection: {[x:string]: any} = {}


const loadAsset = () => {
  file = assetSelect.value // URL
  name = assetSelect.innerText.split('/').pop() ?? 'streaming.nwb' // File Name
  if (file && name) runFetch()
  else console.error('No dandiset selected')
}

const setAssetOptions = async () => {
  dandiStatus.innerHTML = `Loading assets for ${ dandi.options[dandi.selectedIndex].innerHTML as string}...`
  const assets = await getAssets(dandi.value)
  console.log(`Got all assets for ${dandi.value}`, assets)
  Array.from(assetSelect.children).forEach(o => o.remove()) // Remove all children
  const url = `${getInfoURL(dandi.value)}/assets`
  if (assets) {
   const options = await Promise.all(assets.map(async (o: any) => {
      const assetInfo = await getJSON(`${url}/${o.asset_id}/info`)
      const option = document.createElement('option')
      option.value = assetInfo.metadata.contentUrl[0]
      option.innerHTML = `${assetInfo.path} (${formatBytes(assetInfo.size, 2)})`
      return option
    }))

    options.forEach(o => assetSelect.insertAdjacentElement('beforeend', o))
    dandiStatus.style.display = "none"
    dandiDiv.style.display = "block"
    return options.map(o => o.value)
  } else return null
}

fromDANDI.onclick = loadAsset

dandi.onchange = async () =>{
  dandiDiv.style.display = "none"
  dandiStatus.style.display = "block"
  setAssetOptions()
}

getDandisets().then(async dandisets => {

  // Filter drafts
  dandisets = dandisets.filter(o => o.draft_version.status === 'Valid')

  // Display dandisets
  console.log('Got all dandisets', dandisets)
  const options = await Promise.all(dandisets.map(async (o) => {
    const res = getSummary(await getInfo(o.identifier))
    const option = document.createElement('option')
    option.value = res.id
    collection[res.id] = o
    option.innerHTML = `${o.identifier} - ${res.name} (${res.size})`
    return option
  }))

  options.forEach(el => dandi.insertAdjacentElement('beforeend', el))


  setAssetOptions()
})

const fileStreamingCheckbox = document.getElementById('streaming') as HTMLInputElement

// sampleSelect
const sampleSelect = document.getElementById('sampleSelect') as HTMLSelectElement
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

// ------------------ Update File samples
for (let type in links) {

for (let paperName in links[type]) {
  const linkArr = links[type][paperName]

  linkArr.forEach((src, i) => {
    const option = document.createElement('option')
    option.value = src

    const displayName = `${(linkArr.length > 1) ? `${paperName.split(' ')[0]} ${i + 1}` : `${paperName}`}`
    option.setAttribute('data-displayname', displayName)

    option.innerHTML = `${displayName} (${type})`
    option.onchange = () => {
      loader.progress = 0
      file = src
      name = `${displayName.replaceAll(/\s+/g, '')}.nwb` // Must change name for new files to request
      runFetch()
    }

    sampleSelect.insertAdjacentElement('beforeend', option)

  })

}

}

sampleButton.onclick = () => {
  loader.progress = 0
  file = sampleSelect.value
  const displayName = sampleSelect.options[sampleSelect.selectedIndex].getAttribute('data-displayname') as string
  console.log('displayName', displayName)
  name = `${displayName.replaceAll(/\s+/g, '')}.nwb` // Must change name for new files to request
  runFetch()
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

async function runFetch(useStreaming = fileStreamingCheckbox?.checked, testOther = true) {

  const result = await io.fetch(
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


  // if (testOther){
  //   const res = await runFetch(!useStreaming, false)

  //   let streamed = useStreaming ? result : res
  //   const downloaded = useStreaming ? res : result

  //   // Resolved streamed file
  //   const resolveAllProps = async (o:any) => {
  //     for (let key in o) {
  //       const res = await o[key]
  //       if (res instanceof Object) await resolveAllProps(res)
  //     }
  //     return o
  //   }
    
  //   streamed = await resolveAllProps(streamed)

  //   console.log(`------------------ Stream vs Download ------------------`)
  //   const streamJSON = JSON.stringify(streamed)
  //   const downloadJSON = JSON.stringify(downloaded)
  //   console.log('Streaming', streamed, streamJSON)
  //   console.log('Downloaded', downloaded, downloadJSON)
    
  //   const equal = JSON.stringify(res) === JSON.stringify(result)
  //   console.log('Streamed file is equivalent to downloaded file', equal)
  // }

  // Visualize the requested file
  parseFile(result)

  return result

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
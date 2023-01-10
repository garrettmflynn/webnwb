import * as visualscript from '../../external/visualscript/index.esm'
import * as NWBCodec from '../../external/freerange/nwb/index'
import * as freerange from '../../external/freerange/index.esm'

import nwb from '../../src/index'
import * as utils from '../utils'
import links from '../links'

// import * as nwb from 'https://cdn.jsdelivr.net/npm/webnwb@latest/dist/index.esm.js'
import NWBHDF5IO from 'src/io'

let file:string, name:string, io: NWBHDF5IO;

const fileStreamingCheckbox = document.getElementById('streaming') as HTMLInputElement

// Buttons
const buttons = document.getElementById('buttons') as HTMLButtonElement
const normal = document.getElementById('normal') as HTMLButtonElement
const huge = document.getElementById('huge') as HTMLButtonElement
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


// file.acquisition
let key = Object.keys(file.acquisition)[0]
let stimKey = file.stimulus.presentation.keys()[0]

const lines = []


// Show Images
if (file.acquisition[key].externalFile) {

  let waiter = new visualscript.Loader({ showPercent: false })
  waiter.id = 'waiter'
  plot.insertAdjacentElement('beforeend', waiter)

  function createImg(src) {
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

  const arr = await Promise.all(file.acquisition[key].externalFile.map((src) => createImg(src)))


  arr.forEach(o => {
    gallery.insertAdjacentElement('beforeend', o)
  })

  waiter.remove()
  waiter = undefined
}

// Show TimeSeries
else {

  const dataValue = file.acquisition[key].data
  console.log(key, dataValue)

  if (key) lines.push({
    name: 'Acquisition',
    x: file.acquisition[key]?.timestamps ?? Array.from({ length: dataValue.length }, (_, i) => i),
    y: dataValue
  })
}


// Show Stimulus
if (stimKey) lines.push({
  name: 'Stimulus',
  x: file.stimulus.presentation[stimKey]?.timestamps ?? Array.from({ length: file.stimulus.presentation[stimKey].data.length }, (_, i) => i),
  y: file.stimulus.presentation[stimKey].data,
  yaxis: 'y2',
  opacity: 0.5,
})

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
    progressCallback: (ratio, length) => {

      loader.progress = ratio
      loader.text = `${utils.formatBytes(ratio * length, 2)} of ${utils.formatBytes(length, 2)} downloaded.`
    
    }, 
    successCallback: (fromRemote) => { if (!fromRemote) loader.text = 'File loaded from local storage.'},
    useStreaming
  }
)
.then(async (file) => {
  parseFile(file)
})
}

normal.onclick = () => {
file = 'https://api.dandiarchive.org/api/assets/1d82605e-be09-4519-8ae1-6977b91a4526/download/'
name = 'normal.nwb'
runFetch()
}


huge.onclick = () => {
file = 'https://api.dandiarchive.org/api/assets/3bd3a651-f6cc-47a8-adbe-b4d82dbbe4d8/download/'
name = 'huge.nwb'
runFetch()
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
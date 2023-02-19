// Visualscript
// import * as visualscript from '../../../visualscript/src/index'
import * as visualscript from 'visualscript'

// Freerange
import * as NWBCodec from '../../external/freerange/nwb/index'
import * as freerange from '../../external/freerange/index.esm'

import nwb from '../../src/index'
import * as utils from '../utils'
import links from '../links'

// import * as nwb from 'https://cdn.jsdelivr.net/npm/webnwb@latest/dist/index.esm.js'
import * as dandi from '../../packages/dandi/src/index'
import { Asset } from '../../packages/dandi/src/index'

let file:string, name:string, activeFile: any | undefined

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

async function onRender(key: string, target: any, history: {key: string, value: any}[]) {

  let toReturn;

  // const stimulus = await file.stimulus
  // const presentation = await stimulus.presentation
  // // file.acquisition
  // let key = Object.keys(acquisition)[0]

  // let stimKey = (presentation) ? Object.keys(presentation)[0] : undefined
  // const presentationObj = undefined //(stimKey) ? await presentation[stimKey] : undefined

  // const lines = []
  let dataValue

  // Show Images
  const externalFile = await target?.external_file
  if (externalFile) {

    const div = document.createElement('div')
    
    div.style.display = 'flex'
    div.style.flexWrap = 'wrap'
    div.style.alignItems = 'center'
    div.style.justifyContent = 'center'
    div.style.padding = '10px'
    div.style.fontSize = '80%'
    div.innerText = "Loading external images..."

    let count = 0
    function createImg(src: string) {
      return new Promise(resolve => {
        // Create an Image object
        var img = new Image();
        // Add CORS approval to prevent a tainted canvas
        img.crossOrigin = 'Anonymous';
        img.onload = function () { 
          count++
          div.innerText = `Loading external images... (${count}/${externalFile.length})` 
          resolve(img) 
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

    Promise.all(externalFile.map(createImg)).then(arr => {
      div.innerText = ''
      arr.forEach(o => div.insertAdjacentElement('beforeend', o))
    })

    toReturn = div
  }

  // Configure TimeSeries
  else dataValue = await target.data


  // // Show Stimulus
  // if (presentationObj) {
  //   const data = await presentationObj.data
  //   lines.push({
  //     name: 'Stimulus',
  //     x: await presentationObj.timestamps ?? Array.from({ length: data.length }, (_, i) => i),
  //     y: data,
  //     yaxis: 'y2',
  //     opacity: 0.5,
  //   })
  // }



  // Show Timeseries
  if (dataValue) {
    this.timeseries.data = [
      {
        name: 'Acquisition',
        x: (await target?.timestamps) ?? Array.from({ length: dataValue.length }, (_, i) => i),
        y: dataValue
      }
    ]

    const unit = await dataValue.unit
    this.timeseries.layout = {
      // title: {
      //   text: key,
      //   font: {
      //     size: 15
      //   },
      // },
      margin: {
        b: 40,
        t: 40,
        // t: 0,
        pad: 4
      },
      xaxis: {
        title: {
          text:'Samples',
          font: {
            size: 10
          }
        },
      },
      yaxis: { 
        title: {
          text: unit[0].toUpperCase() + unit.slice(1),
          font: {
            size: 10
          }
        },
      },
      // yaxis2: {
      //   title: 'Stimulus',
      //   titlefont: { color: 'rgb(148, 103, 189)' },
      //   tickfont: { color: 'rgb(148, 103, 189)' },
      //   overlaying: 'y',
      //   side: 'right'
      // }
    }

    return this.timeseries

  } 
  
  // Return what has been specified
  else return toReturn

}

const dandisetSelect = document.getElementById('dandi') as HTMLSelectElement
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

const fromStaging = false 
const instance = (fromStaging ? 'staging' : 'main') as 'staging' | 'main'

const versionOptions =  { instance }

const setAssetOptions = async () => {
  dandiStatus.innerHTML = `Loading assets for ${ dandisetSelect.options[dandisetSelect.selectedIndex].innerHTML as string}...`
  const assets = await dandi.getAssets(dandisetSelect.value, versionOptions)
  // console.log(`Got all assets for ${dandisetSelect.value}`, assets)
  Array.from(assetSelect.children).forEach(o => o.remove()) // Remove all children
  if (assets) {
   const options = await Promise.all(assets.map(async (o: Asset) => {
      const assetInfo = await o.get()
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

dandisetSelect.onchange = async () =>{
  dandiDiv.style.display = "none"
  dandiStatus.style.display = "block"
  setAssetOptions()
}

dandi.getAll(instance).then(async dandisets => {

  // Filter drafts
  dandisets = dandisets.filter(o => o.draft_version.status === 'Valid')

  // Display dandisets
  // console.log('Got all dandisets', dandisets)
  const options = await Promise.all(dandisets.map(async (o) => {
    const res = getSummary(await o.getInfo(versionOptions))
    const option = document.createElement('option')
    option.value = res.id
    collection[res.id] = o
    option.innerHTML = `${o.identifier} - ${res.name} (${res.size})`
    return option
  }))

  options.forEach(el => dandisetSelect.insertAdjacentElement('beforeend', el))


  setAssetOptions()
})

const fileStreamingCheckbox = document.getElementById('streaming') as HTMLInputElement

// sampleSelect
const sampleSelect = document.getElementById('sampleSelect') as HTMLSelectElement
const input = document.getElementById('file') as HTMLButtonElement
const get = document.getElementById('get') as HTMLButtonElement
const save = document.getElementById('save') as HTMLButtonElement

// Divs
const editorDiv = document.getElementById('editorDiv') as HTMLDivElement
// const plot = document.getElementById('plot') as HTMLDivElement

// Add loader
let loader = new visualscript.Loader({ color: '#7aff80', type: 'linear', text: 'Select a file', showPercent: false, textBackground: 'black', textColor: 'white'})
loader.id = 'loader'
editorDiv.insertAdjacentElement('beforeend', loader)

// Add object editor
let editor = new visualscript.ObjectEditor({ 
  onRender, 
  readOnly: true 
})
// let editor = new visualscript.Tree()
editor.id = 'editor'
editorDiv.insertAdjacentElement('afterbegin', editor)

console.log('API', nwb)

const io = new nwb.NWBHDF5IO(true)


const indexedDBSelect = document.getElementById('indexedDBSelect') as HTMLSelectElement
const indexedDBButton = document.getElementById('indexedDBButton') as HTMLSelectElement

io.list().then((arr: string[]) => {
  if (arr.length === 0) {
    indexedDBButton.disabled = true
    indexedDBSelect.disabled = true
    return
  }

  arr.forEach((str) => {
    const option = document.createElement('option')
    option.value = str
    option.innerHTML = str
    indexedDBSelect.insertAdjacentElement('beforeend', option)
  })
})

indexedDBButton.onclick = async () => {
  file = indexedDBSelect.value
  name = file
  const loaded = await io.load(file)
  parseFile(loaded)
}

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
  name = `${displayName.replaceAll(/\s+/g, '')}.nwb` // Must change name for new files to request
  runFetch()
}

async function parseFile(file: any, isStreamed: boolean = false){
  console.log('File', file)
  editor.deferValues = isStreamed
  activeFile = file

  loader.progress = 1
  editor.set(file)

// progressDiv.innerHTML = 'Loaded ' + name + '. Check the console for output.'
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
        loader.text = `${name} has been loaded${fromRemote ? '' : ' from local storage'}.`
      },
      useStreaming
    }
  )

  if (useStreaming) loader.text = `${name} is being streamed.`


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
  parseFile(result, useStreaming)

  return result

}


// 2. Allow User to Load their own NWB File
input.onclick = async () => parseFile(await io.upload())

// let filesystem: any = null
// input.onclick = async () => {
//   filesystem = new freerange.System(undefined, {
//     debug: true,
//     ignore: ['DS_Store'],
//     codecs: { nwb: NWBCodec }
//   })

//   // system.progress = globalProgressCallback
//   await filesystem.init()
//   // const f = await filesystem.open()

//   nwbFile = filesystem.files.types.nwb[0]
//   if (nwbFile){
//     name = nwbFile.name
//     const body = await nwbFile.body
//     console.log('GOT?', body)
//     console.log('File', nwbFile)
//     name = nwbFile.name
//     parseFile(body)
//   } else console.error('No NWB files in this directory.')
// }

save.onclick = () => {
    if (activeFile) io.save(activeFile)
    // nwbFile.save() // restrict experimentation to one file
}

// 3. Allow User to Download an NWB File off the Browser
get.onclick = async () => {
  if (activeFile) {
    io.save(activeFile) // save current object edits
    io.download(name)
  }
}
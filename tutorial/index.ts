// WebNWB
// import nwb from '../dist/index.esm.js'
import nwb from '../src/index'
console.log('WebNWB API', nwb)
// Webtrack
import * as webtrack from 'webtrack'

// Visualscript
import * as visualscript from "visualscript"
import create from '../tests/create'
import getFromDandi from '../tests/dandi'

// import * as visualscript from "../../visualscript/src/index"

const localEditorDiv = document.getElementById('localEditorDiv') as HTMLDivElement
const dandiEditorDiv = document.getElementById('dandiEditorDiv') as HTMLDivElement
const dandiEditor = new visualscript.ObjectEditor({ readOnly: true }) // TODO: Allow for a read-only option
dandiEditorDiv.insertAdjacentElement('beforeend', dandiEditor)

const getLocalFileButton = document.querySelector('button') as HTMLButtonElement
getLocalFileButton.innerText = 'Get local file'
const localEditor = new visualscript.ObjectEditor({ readOnly: true })
localEditorDiv.insertAdjacentElement('beforeend', getLocalFileButton)

const writeEditorDiv = document.getElementById('writeEditorDiv') as HTMLDivElement
const writeEditor = new visualscript.ObjectEditor()
writeEditorDiv.insertAdjacentElement('beforeend', writeEditor)


const download = document.getElementById('download') as HTMLButtonElement
const downloadAcquisition = document.getElementById('downloadAcquisition') as HTMLButtonElement

download.disabled = true

let localFile: any;
let dandiFile;

getLocalFileButton.onclick = async () => {
    const io = new nwb.NWBHDF5IO()
    localFile = await io.load()
    console.log('Local NWB File', localFile)
    localEditor.set(localFile)
    writeEditor.set(localFile)
    download.disabled = false
    localEditorDiv.insertAdjacentElement('beforeend', localEditor)
    getLocalFileButton.remove()
}


const getDandiFile = async () => {
    const start = Date.now()

    const id = '000003'
    const asset_id = '29ba1aaf-9091-469a-b331-6b8ab818b5a6'

    dandiFile = await getFromDandi(id, asset_id)
    if (dandiFile) {
        console.log('DANDI NWB File', dandiFile)

        const now = Date.now()
        const timeToDownload = now - start

        // Update Creation Date
        dandiFile.file_create_date = now
        console.log('Updated File Create Date', dandiFile.file_create_date) // [ 1622020000.0 ] // NOTE: Not converting...

        // const url = 'https://api.dandiarchive.org/api/assets/29ba1aaf-9091-469a-b331-6b8ab818b5a6/download/'
        dandiEditor.set(dandiFile)

        if (!localFile) writeEditor.set(dandiFile)

        const styles = `
            position: absolute;
            top: 0;
            right: 0;
            z-index: 1;
            font-size: 10px;
            padding: 7px 10px;
            color: white;
        `

        dandiEditorDiv.insertAdjacentHTML('beforebegin', `<span style="${styles}"><b>Time to stream:</b> ${(timeToDownload/1000).toFixed(2)}s</p>`)
    }
    
    else console.error(`No dandiset found with ID ${id}`)
}

getDandiFile()

const file = create()

const spanX = document.getElementById('cursorX') as HTMLSpanElement
const spanY = document.getElementById('cursorY') as HTMLSpanElement
const spanTime = document.getElementById('cursorTime') as HTMLSpanElement
const activateBehaviors = document.getElementById('activateBehaviors') as HTMLButtonElement

const tracker = new webtrack.Tracker()
tracker.start()

const spatialSeries = file.processing.behavior.Position.cursor

tracker.set('pointermove', (info: any) => {
    const { x, y, timestamp } = info
    spanTime.innerText = (timestamp / 1000).toFixed(2)
    spanX.innerText = x.toFixed(2)
    spanY.innerText = y.toFixed(2)

    spatialSeries.data[0].push(x)
    spatialSeries.data[1].push(y)
    const secondsSincePageLoad = timestamp / 1000
    spatialSeries.timestamps.push(secondsSincePageLoad)
    // TODO: actually link this in
})

// const emoji = document.getElementById('emoji')

const emoji = document.createElement('span')
emoji.innerText = '😊'
emoji.style.transform = 'translate(-50%, -50%)'
emoji.style.position = 'fixed'
emoji.style.display = 'none'
emoji.style.fontSize = '100px'
emoji.style.zIndex = '1000'
emoji.style.userSelect = 'none'
document.body.appendChild(emoji)

const timeseries = file.processing.behavior.BehavioralEvents.emojiReactions

const activateBehavioralRewards = () => {

    let active = false
    tracker.set('click', (info: any) => {

        if (!active) {
            emoji.style.display = 'block'
            emoji.style.left = info.x + 'px'
            emoji.style.top = info.y + 'px'
            active = true

            const msToShow = Math.random() * 1000
            setTimeout(() => {
                emoji.style.display = 'none'
                active = false  
                timeseries.data.push(msToShow)
                timeseries.timestamps.push(info.timestamp / 1000)
            }, msToShow)
        }
    }) 

    activateBehaviors.innerHTML = 'deactivate'
    activateBehaviors.onclick = deactivateBehavioralRewards
}

activateBehaviors.onclick = activateBehavioralRewards

function deactivateBehavioralRewards() {
    tracker.set('click', activateBehavioralRewards)
    activateBehaviors.innerHTML = 'activate'
}

console.log('Acquisition NWB File', file)

downloadAcquisition.onclick = async () => {
    const filename = 'myBehavior.nwb'
    const io = new nwb.NWBHDF5IO()
    console.log('Trying to save', file)

    const savedAs = await io.save(file, filename)
    io.download(filename) // Downloads to the user's computer

    console.log('Saved', savedAs)
    const fileFromLocalStorage = io.load(savedAs)
    console.log('File from local storage:', fileFromLocalStorage)
}

download.onclick = async () => {
    const io = new nwb.NWBHDF5IO()
    console.log('Trying to save', writeEditor.target)
    const savedAs = io.save(writeEditor.target)
    console.log('Saved', savedAs)
    const fileFromLocalStorage = await io.load(savedAs)
    console.log('File from local storage:', fileFromLocalStorage)
}

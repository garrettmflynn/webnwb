// WebNWB
// import nwb from '../dist/index.esm.js'
import nwb from '../src/index'
console.log('WebNWB API', nwb)
// Webtrack
import * as webtrack from '../external/webtrack/index.esm.js'

// DANDI
// import * as dandi from '../packages/dandi/dist/index.esm.js'
import * as dandi from '../packages/dandi/src/index'
// import * as dandi from 'htts://jsdelivr.net/npm/dandi@0.0.2/dist/index.esm'

// Visualscript
import * as visualscript from "../node_modules/visualscript/dist/index.esm.js"

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

let localFile: any;
let dandiFile;

getLocalFileButton.onclick = async () => {
    const io = new nwb.NWBHDF5IO()
    localFile = await io.read()
    localEditor.set(localFile)
    writeEditor.set(localFile)
    localEditorDiv.insertAdjacentElement('beforeend', localEditor)
    getLocalFileButton.remove()
}


const getDandiFile = async () => {
    const id = '000003'
    const dandiset = await dandi.get(id) // Request a dandiset by ID

    if (dandiset) {
        // const gotDandiset = (await dandi.getAll()).find(o => o.identifier === id)// Get the first dandiset from the list of all dandisets
        const asset = await dandiset.getAsset('29ba1aaf-9091-469a-b331-6b8ab818b5a6')
        const io = new nwb.NWBHDF5IO()
        const start = Date.now()
        dandiFile = await io.fetch(asset.metadata.contentUrl[0], 'dandiTest.nwb', { useStreaming: true })
        const now = Date.now()
        const timeToDownload = now - start

        file.fileCreateDate = now
        console.log(file.fileCreateDate) // [ 1622020000.0 ]

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

const spanX = document.getElementById('cursorX') as HTMLSpanElement
const spanY = document.getElementById('cursorY') as HTMLSpanElement
const spanTime = document.getElementById('cursorTime') as HTMLSpanElement
const activateBehaviors = document.getElementById('activateBehaviors') as HTMLButtonElement

const tracker = new webtrack.Tracker()
tracker.start()

tracker.set('pointermove', (info: any) => {
    const { x, y, timestamp } = info
    spanTime.innerText = (timestamp / 1000).toFixed(2)
    spanX.innerText = x.toFixed(2)
    spanY.innerText = y.toFixed(2)
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
            }, msToShow)
        }
    }) 

    activateBehaviors.innerHTML = 'deactivate'
    activateBehaviors.onclick = () => deactivateBehavioralRewards()
}

activateBehaviors.onclick = () => activateBehavioralRewards()

function deactivateBehavioralRewards() {
    tracker.set('click', () => {})
    activateBehaviors.innerHTML = 'activate'
}


const file = new nwb.NWBFile({
    sessionDescription: 'EEG data and behavioral data recorded while navigating a webpage.',
    identifier: 'WebNWB_Documentation_Session_' + Math.random().toString(36).substring(7),
    sessionStartTime: Date.now(),
    experimenter: 'Garrett Flynn',
    institution: 'Brains@Play'
})

console.log('NWB File', file)

// TODO: Fix this...
const spatialSeries = new nwb['nwb.behavior'].SpatialSeries({
    name: 'cursor',
    description: 'The position (x, y) of the cursor over time.',
    data: [
        [],
        []
    ],
    referenceFrame: '(0,0) is the top-left corner of the visible portion of the page.'
})
console.log('spatialSeries', spatialSeries)

const position = new nwb['nwb.behavior'].Position()
console.log('position', position)

position.addSpatialSeries(spatialSeries) // TODO: Fix this helper function by recognizing the class name
const behavior = new nwb.ProcessingModule({ description: 'Behavioral data recorded while navigating a webpage.' })
console.log('ProcessingModule', behavior)

behavior.addPosition('position', position)
file.addProcessingModule('behavior', behavior)

// Create a TimeSeries object to track behavior events
const data: any = []
data.unit = 'ms'
const timeseries = new nwb.TimeSeries({
    description: 'The length of time the emoji was shown on the page.',
    data: [],
    timestamps: []
})
console.log('timeseries', timeseries)

// Add these behavioral events to the NWB file
const behavioralEvents = new nwb['nwb.behavior'].BehavioralEvents()
behavioralEvents.addTimeSeries('buttonPresses', timeseries)
behavior.addDataInterface('behavioralEvents', behavioralEvents)
console.log('behavioralEvents', behavioralEvents)

console.error('ACTUALLY CAN SAVE THE FILE HERE')
// // Save file
// const filename = 'myFile.nwb'
// const io = new nwb.NWBHDF5IO()
// io.write(file, filename)
// io.save(filename) // Saves in browser storage
// io.download(filename) // Downloads to the user's computer

// WebNWB
// import nwb from '../dist/index.esm.js'
import nwb from '../src/index'
console.log('WebNWB API', nwb)
// Webtrack
import * as webtrack from 'webtrack'

// DANDI
// import * as dandi from '../packages/dandi/dist/index.esm.js'
import * as dandi from '../packages/dandi/src/index'
// import * as dandi from 'htts://jsdelivr.net/npm/dandi@0.0.2/dist/index.esm'

// Visualscript
import * as visualscript from "visualscript"

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
    const id = '000003'
    const dandiset = await dandi.get(id) // Request a dandiset by ID

    if (dandiset) {
        // const gotDandiset = (await dandi.getAll()).find(o => o.identifier === id)// Get the first dandiset from the list of all dandisets
        const asset = await dandiset.getAsset('29ba1aaf-9091-469a-b331-6b8ab818b5a6')
        const io = new nwb.NWBHDF5IO()
        const start = Date.now()
        dandiFile = await io.fetch(asset.metadata.contentUrl[0], 'dandiTest.nwb', { useStreaming: true })
        console.log('DANDI NWB File', dandiFile)

        const now = Date.now()
        const timeToDownload = now - start

        // Update Creation Date
        file.file_create_date = now
        console.log(file.file_create_date) // [ 1622020000.0 ] // NOTE: Not converting...

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
    session_description: 'EEG data and behavioral data recorded while navigating a webpage.',
    identifier: 'WebNWB_Documentation_Session_' + Math.random().toString(36).substring(7),
    session_start_time: Date.now(),
    experimenter: 'Garrett Flynn',
    institution: 'Brains@Play'
})

console.log('Acquisition NWB File', file)

// Subject
const subject = {
    subject_id: Math.random().toString(36).substring(7),
    // age: "P90D",
    // description: "someone using the website",
    species: "Homo sapien",
    // sex: "U",
}


console.warn('Original Subject Value', file.general.subject) // TODO: Make sure this is undefined first...as this is currently an empty class.

// -------- NOTE: All of these methods are equivalent --------
// file.general.subject = new nwb.Subject(subject) 
// file.subject = subject // Silenced
file.general.subject = subject 
// file.createSubject(subject)
// file.addSubject(new nwb.Subject(subject))
// file.addSubject(subject)
console.log('Subject', file.general.subject) 

const spatialSeries = new nwb.behavior.SpatialSeries({
    name: 'cursor',
    description: 'The position (x, y) of the cursor over time.',

    // // TODO: Handle data shapes properly
    // // Mismatched types for data: numeric is expected but object was provided (because of nested arrays)
    // data: [
    //     [],
    //     []
    // ],
    referenceFrame: '(0,0) is the top-left corner of the visible portion of the page.'
})
console.log('spatialSeries', spatialSeries)

const position = new nwb.behavior.Position()
console.log('position', position)

position.addSpatialSeries(spatialSeries)

const behavior = new nwb.ProcessingModule({ name: 'behavior', description: 'Behavioral data recorded while navigating a webpage.' })
console.log('ProcessingModule', behavior)

behavior.addDataInterface(position) // NOTE: Might just want to be .add() | Convention is uppercase
file.addProcessingModule(behavior)

// Create a TimeSeries object to track behavior events
const data: any = []
data.unit = 'ms'

const behavioralEvents = new nwb.behavior.BehavioralEvents()

console.warn('Creating TimeSeries...')
// Use the create function...
behavioralEvents.createTimeSeries({
    name: 'emojiReactions',
    description: 'The length of time the emoji was shown on the page.',
    data: [],
    timestamps: [],
    unit: 'ms' // NOTE: Accomodate moving this to the data object
})

console.log('behavioralEvents', behavioralEvents)
console.log('emojiReactions (TimeSeries)', behavioralEvents.emojiReactions)

// Add these behavioral events to the NWB file
behavior.addDataInterface(behavioralEvents) // NOTE: Might just want to be .add() | Convention is uppercase

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

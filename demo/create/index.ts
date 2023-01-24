import * as visualscript from '../../../visualscript/src/index'

import nwb from '../../src/index'
import NWBHDF5IO from 'src/io';

// Get Elements
let i = 0
const createSection = document.getElementById('create') as HTMLDivElement
let editor = new visualscript.ObjectEditor()
createSection.insertAdjacentElement('beforeend', editor)

const increment = document.getElementById('increment') as HTMLDivElement
increment.onclick = () => {
    if (io){
        i++
        if (i <= 5) step(i)
        else console.warn('Done stepping through the demo!')
    }
}



const update = (file: any) => {
    editor.set(file)
}

// 1. Create NWB File
const sessionStartTime = Date.now()
const fileCreateDate = Date.now()


const fileName = 'test_file_path.nwb'
const nwbFile = new nwb.NWBFile({
    sessionDescription: 'demonstrate NWBFile basics',
    identifier: 'NWB123',
    sessionStartTime,
    fileCreateDate
})

update(nwbFile)

let io: NWBHDF5IO;

let testTs: any

const step = async (i:number) => {

    switch(i) {

        case 1: 
                // Add TimeSeries Data
                const timestamps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                const data = Array.from(timestamps, e => 100 + e * 10)

                testTs = new nwb.TimeSeries({
                    name: 'testTimeseries', 
                    data: data, 
                    units: 'm',
                    // starting_time:0.0,
                    // rate:1.0,
                    timestamps
                })

                nwbFile.addAcquisition(testTs)
                update(nwbFile)

                break;


        case 2: 
            // 5. Add a Data Interface to the NWB File (https://pynwb.readthedocs.io/en/stable/overview_nwbFile.html#modules-overview)

            const position = new nwb.behavior.Position()
            const positionData = Array.from({ length: 20 }, (e, i) => i / 20)
            const positionTimestamps = Array.from({ length: 20 }, (e, i) => i / 200)

            const spatialSeries = new nwb.behavior.SpatialSeries({
                name: "SpatialSeries",
                description:"(x,y) position in open field",
                data: new Float32Array(positionData),
                timestamps: new Float32Array(positionTimestamps),
                referenceFrame:"(0,0) is bottom left corner",
            })

            position.addSpatialSeries(spatialSeries)

            position.createSpatialSeries({
                name: "SpatialSeries2",
                description:"(x,y) position in open field",
                data: new Float32Array(positionData),
                timestamps: new Float32Array(positionTimestamps),
                referenceFrame:"(0,0) is bottom left corner",
            })


             // 6. Add Processing Modules to the NWB File
            nwbFile.createProcessingModule({
                name: 'behavior',
                description: 'preprocessed behavioral data'
            })

            const ecephysModule = new nwb.ProcessingModule({
                name: 'ecephys', 
                description: 'preprocessed extracellular electrophysiology'
            })

            nwbFile.addProcessingModule(ecephysModule)
            

            // Add data interface
            nwbFile.processing['behavior'].addDataInterface(position)

            update(nwbFile)
            break;
        
        case 3: 
            // 6. Organize NWB File into Trials
            // nwbFile.addTrialColumn('stim', 'the visual stimuli during the trial')
            nwbFile.addTrial({
                startTime: 0.0, 
                stopTime: 2.0,
                stim: 'person'
            })

            nwbFile.addTrial({
                startTime: 3.0, 
                stopTime: 5.0,
                stim: 'ocean'
            })

            nwbFile.addTrial({
                startTime: 6.0, 
                stopTime: 8.0,
                stim: 'desert'
            })

            update(nwbFile)
            break;
 
        case 4:
            // 7. Organize NWB File into Epochs
            nwbFile.addEpoch({
                startTime: 2.0, 
                stopTime: 4.0,
                tags: ['first', 'example'],
                timeseries: [testTs,]
            })

            nwbFile.addEpoch({
                startTime: 6.0, 
                stopTime: 8.0,
                tags: ['second', 'example'],
                timeseries: [testTs,]
            })
            
            update(nwbFile)
            break;

        case 5:

                // From: https://youtu.be/W8t4_quIl1k?t=1485
                // 9. Add and Write Units to NWB File
                // nwbFile.addUnitColumn('location', 'the anatomical location of this unit')
                // nwbFile.addUnitColumn('quality', 'the quality for the inference of this unit')

                const nShanks = 4
                const nChannelsPerShank = 3
                const variables = ['x', 'y', 'z', 'imp', 'location', 'filtering', 'group', 'label']
                const values = [5.3, 1.5, 8.5, NaN, 'unknown', 'unknown']
                const electrodeTable: any = new Map() // FOR NOW, WE ARE IMPLEMENTING CUSTOM TABLES
                
                const device = new nwb.device.Device({
                    description: 'the best array',
                    manufacturer: 'Probe Company 9000'
                })

                const deviceName = 'array'
                device.name = deviceName
                nwbFile.addDevice(device)
                // OR: nwb.general.devices.set(deviceName, device)

                const deviceLink = device // TODO: Actually create HDF5 links
                for (let iShank = 0; iShank < nShanks; iShank++) {
                    const groupName = `shank${iShank}`
                    const electrodeGroup = new nwb.ecephys.ElectrodeGroup({
                        description: `electrode group for shank ${iShank}`,
                        location: 'brain area',
                        device: deviceLink,
                    })

                    nwbFile.general.extracellularEphys.set(groupName, electrodeGroup)
                    const groupObjectView = electrodeGroup
                    for (let iElec = 0; iElec < nChannelsPerShank; iElec++) {
                        const theseValues = [...values, groupObjectView, `${groupName}elec${iElec}`]
                        variables.forEach((key,i) => {
                            let store = electrodeTable.get(key)
                            if (!store) {
                                electrodeTable.set(key, [])
                                store = electrodeTable.get(key)
                            }

                            store.push(theseValues[i])
                        })
                    }
                }

                nwbFile.general.extracellularEphys.electrodes = electrodeTable

                // nwbFile.addUnit(
                //     {
                //         1, [2.2, 3.0, 4.5], [[1, 10]], 
                //         location: 'CA1', 
                //         quality:.95
                //     }
                // )
                // nwbFile.addUnit(2, [2.2, 3.0, 25.0, 26.0], [[1, 10], [20, 30]], 'CA3', 0.85)
                // nwbFile.addUnit(3, [1.2, 2.3, 3.3, 4.5], [[1, 10], [20, 30]], 'CA1', 0.90)
                update(nwbFile)
                break;
             // 8. Specify Other Time Interval in NWB File
            //       sleepStages = new nwb.epoch.TimeIntervals(
            //           name="sleepStages",
            //           description="intervals for each sleep stage as determined by EEG",
            //       )

            //       sleepStages.addColumn(name="stage", description="stage of sleep")
            //       sleepStages.addColumn(name="confidence", description="confidence in stage (0-1)")

            //       sleepStages.addRow(startTime=0.3, stopTime=0.5, stage=1, confidence=.5)
            //       sleepStages.addRow(startTime=0.7, stopTime=0.9, stage=2, confidence=.99)
            //       sleepStages.addRow(startTime=1.3, stopTime=3.0, stage=3, confidence=0.7)

            //       nwbFile.addTimeIntervals(sleepStages)
            //   update(nwbFile)

                    
            // 10. Append Information to an Existing NWB File
            // const nwbFile2 = io4.read()
            // const position2 = nwbFile2.processing['behavior'].dataInterfaces['Position']
            // const data2 = Array.from({length: 10}, (v,i) => 300 + 10*i)

            // const testSpatialSeries = new nwb.behavior.SpatialSeries('test_spatialseries2', data2, 'starting_gate', {timestamps})
            // position2.addSpatialSeries(testSpatialSeries)
            // io4.write(nwbFile2)
    }


    // NOTE: Unable to store after second iteration...
    await io.write(nwbFile, fileName)


    // ----------------- Check Saved NWB File -----------------
    const nwbFileIn = await io.read()
    console.log('Latest NWB File from Local Storage', nwbFileIn)

    // if (nwbFileIn) {

    //     const isSame = (o1:any, o2:any) => {
    //         const str1 = JSON.stringify(o1)
    //         const str2 = JSON.stringify(o2)
    //         return str1 === str2 && o1 && o2 && (Object.keys(o1).length && Object.keys(o2).length)
    //     }

    //     console.log(`----------------- Checking saved file for data integrity -----------------`)
    //     const timeseries = nwbFileIn.acquisition['testTimeseries']
    //     const ogTimeseries = nwbFile.acquisition['testTimeseries']
    //     const behavior = nwbFileIn.processing.behavior
    //     const ogBehavior = nwbFile.processing.behavior
    //     const ecephys = nwbFileIn.processing.ecephys
    //     const ogEcephys = nwbFile.processing.ecephys

    //     const trials = nwbFileIn.intervals.trials
    //     const ogTrials = nwbFile.intervals.trials

    //     const epochs = nwbFileIn.intervals.epochs
    //     const ogEpochs = nwbFile.intervals.epochs

    //     const units = nwbFileIn.units
    //     const ogUnits = nwbFile.units

    //     const sameTimeseries = isSame(timeseries, ogTimeseries)
    //     const sameBehavior = isSame(behavior, ogBehavior)
    //     const sameEphys = isSame(ecephys, ogEcephys)
    //     const sameTrials = isSame(trials, ogTrials)
    //     const sameEpochs = isSame(epochs, ogEpochs)
    //     const sameUnits = isSame(units, ogUnits)

    //     if (sameTimeseries) console.log(`file.acquisition.testTimeseries is the same!`)
    //     else console.warn(`file.acquisition.testTimeseries might not be the same!`, timeseries, ogTimeseries)

    //     if (ogBehavior) {
    //         if (sameBehavior) console.log(`file.processing.behavior is the same!`)
    //         else console.warn(`file.processing.behavior might not be the same!`, behavior, ogBehavior)
    //     } 

    //     if (ogEcephys) {
    //         if (sameEphys) console.log(`file.processing.ecephys is the same!`, ecephys, ogEcephys)
    //         else console.warn(`file.acquisition.ecephys might not be the same!`, ecephys, ogEcephys)
    //     }

    //     if (ogTrials) {
    //         if (sameTrials) console.log(`file.intervals.trials is the same!`)
    //         else console.warn(`file.intervals.trials might not be the same!`, trials, ogTrials)
    //     }

    //     if (ogEpochs) {
    //         if (sameEpochs) console.log(`file.intervals.epochs is the same!`)
    //         else console.warn(`file.intervals.epochs might not be the same!`, epochs, ogEpochs)
    //     }

    //     // if (ogUnits) {
    //     //     if (sameUnits) console.log(`file.units is the same!`)
    //     //     else console.warn(`file.units might not be the same!`, units, ogUnits)
    //     // }


    // } else console.error('file reloading failed...')

}

io = new nwb.NWBHDF5IO(true)
increment.classList.remove('disabled')
console.log('File', nwbFile, nwbFile.nwbVersion)

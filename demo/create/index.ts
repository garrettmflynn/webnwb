import * as visualscript from '../../external/visualscript/index.esm'
import * as hdf5 from "https://cdn.jsdelivr.net/npm/h5wasm@latest/dist/esm/hdf5_hl.js";

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
        step(i)
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

const step = async (i:number) => {

    switch(i) {

        case 1: 
                // Add TimeSeries Data
                const timestamps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                const data = Array.from(timestamps, e => 100 + e * 10)

                const testTs = new nwb.TimeSeries({
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

            console.log('position', position)
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

            console.log('nwbFile.addProcessingModule', nwbFile.processing.behavior)

            const ecephysModule = new nwb.ProcessingModule({
                name: 'ecephys', 
                description: 'preprocessed extracellular electrophysiology'
            })
            nwbFile.addProcessing(ecephysModule)
            console.log(nwbFile.processing, nwbFile.processing['behavior'])
            nwbFile.processing['behavior'].addDataInterface(position)
            update(nwbFile)
            break;
        
        case 3: 
              // 6. Organize NWB File into Trials
              console.log('nwbFile.addTrial', nwbFile)
            nwbFile.addTrialColumn('stim', 'the visual stimuli during the trial')
            nwbFile.addTrial(0.0, 2.0, 'person')
            nwbFile.addTrial(3.0, 5.0, 'ocean')
            nwbFile.addTrial(6.0, 8.0, 'desert')
            update(nwbFile)
            break;
 
        case 4:
            // 7. Organize NWB File into Epochs
            console.log('nwbFile.addEpoch', nwbFile)

            nwbFile.addEpoch(2.0, 4.0, ['first', 'example'], [testTs,])
            nwbFile.addEpoch(6.0, 8.0, ['second', 'example'], [testTs,])
            update(nwbFile)
            break;

        case 5:
              // 9. Add and Write Units to NWB File
                nwbFile.addUnitColumn('location', 'the anatomical location of this unit')
                nwbFile.addUnitColumn('quality', 'the quality for the inference of this unit')

                nwbFile.addUnit(1, [2.2, 3.0, 4.5], [[1, 10]], 'CA1', .95)
                nwbFile.addUnit(2, [2.2, 3.0, 25.0, 26.0], [[1, 10], [20, 30]], 'CA3', 0.85)
                nwbFile.addUnit(3, [1.2, 2.3, 3.3, 4.5], [[1, 10], [20, 30]], 'CA1', 0.90)
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
            // io4.close()
    }

    await io.write(nwbFile, fileName)

    if (i === 2) {

        // Check Saved NWB File
        const nwbFileIn = await io.read()
        console.log('From Saved. Does it have the test acquisition?', nwbFileIn)

        if (nwbFileIn) {
            const timeseries = nwbFileIn.acquisition['testTimeseries']
            const ogTimeseries = nwbFile.acquisition['testTimeseries']

            console.log(`file.acquisition['testTimeseries']`, timeseries == ogTimeseries, timeseries, ogTimeseries)

            console.log('timeseriesIn', timeseries)
            console.log('timeseriesIn.data', timeseries?.data)

            const behavior = nwbFileIn.processing.behavior
            const ogBehavior = nwbFile.processing.behavior
            const ecephys = nwbFileIn.processing.ecephys
            const ogEcephys = nwbFile.processing.ecephys

            console.log(`file.processing.behavior`, behavior == ogBehavior, behavior, ogBehavior)
            console.log(`file.processing.ecephys`, ecephys == ogEcephys, ecephys, ogEcephys)


        } else console.error('file reloading failed...')

    }

    console.log('File', nwbFile)

}

hdf5.ready.then(() => {
    io = new nwb.NWBHDF5IO(hdf5, true)
    increment.classList.remove('disabled')
    console.log('File', nwbFile)
})
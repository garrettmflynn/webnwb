import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

export default function DemoExample() {


  const get = useRef(null);
  const output = useRef(null);

  useEffect(async () => {

    let reader = await import('h5wasm')
    let nwb = await import('../../../../../src')
    if (nwb?.default) nwb = nwb.default

    const main = async () => {

      
      // 1. Create NWB File
      const sessionStartTime = Date.now()
      const fileCreateDate = Date.now()


      const fileName = 'example_file_path.nwb'
      const nwbFile = new nwb.NWBFile({
        session_description: 'demonstrate NWBFile basics',
        identifier: 'NWB123',
        sessionStartTime,
        fileCreateDate
      })


      // 2. Add TimeSeries Data
      const timestamps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      const data = Array.from(timestamps, e => 100 + e * 10)

      const testTs = new nwb.TimeSeries('testTimeseries', data, 'm',
        {
          // starting_time:0.0,
          // rate:1.0,
          timestamps
        })

      nwbFile.addAcquisition(testTs)
      nwbFile.acquisition['testTimeseries']
      nwbFile.getAcquisition('testTimeseries')

      // 3. Save NWB File
      console.log('Write This', nwbFile)
      const io = new nwb.NWBHDF5IO(reader)
      io.write(nwbFile, fileName)


      // 4. Read Saved NWB File
      const nwbFileIn = await io.read()
      console.log('From Saved', nwbFileIn)

      const timeseriesIn = nwbFileIn.acquisition['testTimeseries']
      console.log(timeseriesIn)
      console.log(timeseriesIn.data)

      // 5. Add a Data Interface to the NWB File (https://pynwb.readthedocs.io/en/stable/overview_nwbFile.html#modules-overview)

      const position = new nwb.behavior.Position()
      const positionData = Array.from({ length: 20 }, (e, i) => i * (1 / 20))

      const spatialSeries = new nwb.behavior.SpatialSeries('position2', positionData, 'starting gate', { rate: 50 })

      position.addSpatialSeries(spatialSeries)
      position.createSpatialSeries('position1', positionData, 'starting gate', { rate: 50 })

      // 6. Add Processing Modules to the NWB File
      const behaviorModule = new nwbFile.createProcessingModule('behavior', 'preprocessed behavioral data')
      const ecephysModule = new nwb.ProcessingModule('ecephys', 'preprocessed extracellular electrophysiology')
      nwbFile.addProcessingModule(ecephysModule)
      console.log(nwbFile.processing)
      nwbFile.processing['behavior'].add(position) // TODO: Check since this was 'behavior'

      // 6. Organize NWB File into Trials
      nwbFile.addTrialColumn('stim', 'the visual stimuli during the trial')

      nwbFile.addTrial(0.0, 2.0, 'person')
      nwbFile.addTrial(3.0, 5.0, 'ocean')
      nwbFile.addTrial(6.0, 8.0, 'desert')

      // 7. Organize NWB File into Epochs
      nwbFile.addEpoch(2.0, 4.0, ['first', 'example'], [testTs,])
      nwbFile.addEpoch(6.0, 8.0, ['second', 'example'], [testTs,])

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

      // 9. Add and Write Units to NWB File
      nwbFile.addUnitColumn('location', 'the anatomical location of this unit')
      nwbFile.addUnitColumn('quality', 'the quality for the inference of this unit')

      nwbFile.addUnit(1, [2.2, 3.0, 4.5], [[1, 10]], 'CA1', .95)
      nwbFile.addUnit(2, [2.2, 3.0, 25.0, 26.0], [[1, 10], [20, 30]], 'CA3', 0.85)
      nwbFile.addUnit(3, [1.2, 2.3, 3.3, 4.5], [[1, 10], [20, 30]], 'CA1', 0.90)


      io.write(nwbFile)
      // io.close() // Done

      // 10. Append Information to an Existing NWB File
      // const nwbFile2 = io4.read()
      // const position2 = nwbFile2.processing['behavior'].dataInterfaces['Position']
      // const data2 = Array.from({length: 10}, (v,i) => 300 + 10*i)

      // const testSpatialSeries = new nwb.behavior.SpatialSeries('test_spatialseries2', data2, 'starting_gate', {timestamps})
      // position2.addSpatialSeries(testSpatialSeries)
      // io4.write(nwbFile2)
      // io4.close()
      return nwbFile

    }

    get.current.onclick = () => {
      main().then(async res => {
        console.log(res)
      }).catch(err => {
        console.log(err)
        output.current.innerHTML = err.error
      })
    }
  });

  return (
    <header className={clsx('hero hero--primary')}>
      <div className="container">
        <h1 className="hero__title">Example</h1>
        <p className="subtitle"><strong>File:</strong> <span ref={output}></span></p>
        <div>
          <button ref={get} className="button button--secondary button--lg">Get</button>
        </div>
      </div>
    </header>
  );
}

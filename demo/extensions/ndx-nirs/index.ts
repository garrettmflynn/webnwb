import { NWBAPI, NWBHDF5IO } from '../../../src/index'

import ndxNirsNamespaces from './ndx-nirs.namespace.yaml'
const namespace = ndxNirsNamespaces.namespaces[0]
import ndxNirsExtension from './ndx-nirs.extensions.yaml'

const nirsAPI = new NWBAPI({
  [namespace.name]: {
    [namespace.version]: {
      namespace: ndxNirsNamespaces,
      [`${namespace.name}.extensions`]: ndxNirsExtension
    }
  }
})

const {
  NWBFile,
  NIRSSourcesTable,
  NIRSChannelsTable,
  NIRSDetectorsTable,
  NIRSDevice,
  NIRSSeries,
  DynamicTableRegion
} = nirsAPI

// --------- create some example data to add to the NWB file ---------

const wavelengths = [690.0, 830.0]
// create NIRS source & detector labels
const source_labels = ["S1", "S2"]
const detector_labels = ["D1", "D2"]

// create NIRS source & detector positions as a numpy array
// with dims: [num sources/detectors rows x 2 columns (for x, y)]
const source_pos = [[-2.0, 0.0], [-4.0, 5.6]]
const detector_pos = [[0.0, 0.0], [-4.0, 1.0]]

// create a list of source detector pairs (pairs of indices)
const source_detector_pairs = [[0, 0], [0, 1], [1, 0], [1, 1]]

// --------- create NWB file using the example data above ---------
// create a basic NWB file
const nirsFile = new NWBFile({
  session_description: "A NIRS test session",
  identifier: "nirs_test_001",
  session_start_time: (new Date()).toISOString(),
  experimenter: 'Garrett Flynn',
  institution: 'Hypergamma',
  subject: new nirsAPI.Subject({
    subject_id: "nirs_subj_01"
  }),
})

console.log('NIRS File', nirsFile)

// create and populate a NIRSSourcesTable containing the
// label and location of optical sources for the device
const sources = new NIRSSourcesTable()
// add source labels & positions row-by-row

for (let i_source = 0; i_source < source_labels.length; i_source++) {
  // sources.add_row({
  //   label: source_labels[i_source],
  //   x: source_pos[i_source, 0],
  //   y: source_pos[i_source, 1],
  // })
}
// create and populate a NIRSDetectorsTable containing the
// label and location of optical sources for the device
const detectors = new NIRSDetectorsTable()
// add a row for each detector

for (let i_detector = 0; i_detector < detector_labels.length; i_detector++) {
  // detectors.add_row({
  //   label: detector_labels[i_detector],
  //   x: detector_pos[i_detector, 0],
  //   y: detector_pos[i_detector, 1],
  // }) // z-coordinate is optional
}
// create a NIRSChannelsTable which defines the channels
// between the provided sources and detectors
const channels = new NIRSChannelsTable({
  sources,
  detectors
})

// each channel is composed of a single source, a single detector, and the wavelengt// most source-detector pairs will use two separate wavelengths, and have two channefor i_source, i_detector in source_detector_pairs:
source_detector_pairs.forEach(([i_source, i_detector]) => {

  wavelengths.forEach(source_wavelength => {

    // // for the source and detector parameters, pass in the index of
    // // the desired source (detector) in the sources (detectors) table
    // channels.add_row({
    //   label: `${source_labels[i_source]}.${detector_labels[i_detector]}`,
    //   source: i_source,
    //   detector: i_detector,
    //   source_wavelength,
    // })

  })

})

// create a NIRSDevice which contains all of the information
// about the device configuration and arrangement
const device = new NIRSDevice({

  name: "hypergamma-device",
  description: "Low-cost fNIRS device",
  manufacturer: "Hypergamma",
  nirs_mode: "time-domain",
  channels: channels,
  sources: sources,
  detectors: detectors,

  // depending on which nirs_mode is selected, additional parameter values should  // included. these two parameters are included because we are using time-domain  time_delay=1.5, // in ns
  time_delay_width: 0.1, // in ns

  // specialized NIRS hardware may require additional parameters that can be defin // using the `additional_parameters` field:
  additional_parameters: "flux_capacitor_gain = 9000; speaker_volume = 11;"
})
// add the device to the NWB file
nirsFile.addDevice(device)

const timeResolution = 0.01
const nTimestamps = 10 / timeResolution

// create a NIRSSeries timeseries containing raw NIRS data
const nirs_series = new NIRSSeries({
  name: "nirs_data",
  description: "The raw NIRS channel data",
  timestamps: Array.from({ length: nTimestamps }, (e, i) => i * timeResolution), // in seconds
  // reference only the channels associated with this series
  channels: new DynamicTableRegion({
    name: "channels",
    description: "an ordered map to the channels in this NIRS series",
    table: channels,
    data: channels.id //channels.id[:],
  }),
  data: Array.from({ length: nTimestamps }, () => Array.from({ length: 8 }, () => Math.random())), // shape: (num timesteps, num channels)
  unit: "V",
})

// add the series to the NWB file
nirsFile.addAcquisition(nirs_series)

console.log('Device', nirsFile.general.devices["nirs_device"])
console.log('Acquisition', nirsFile.acquisition["nirs_data"])

// // Write the NWBFile
// const io = new NWBHDF5IO()
// io.save(nirsFile, 'nirs.nirsFile').then((filename: string) => {
//   io.load(filename).then((reloaded) => {
//     console.log('Reloaded NIRS', reloaded, reloaded.acquisition)
//     console.log('Reloaded Devide', reloaded.general.devices["nirs_device"])
//     console.log('Reloaded Acquisition', reloaded.acquisition["nirs_data"])
//   })
// })


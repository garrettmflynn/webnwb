# WebNWB
Neurodata without Borders — directly on the browser.

[![Npm package version](https://badgen.net/npm/v/webnwb)](https://npmjs.com/package/webnwb)
[![Npm package monthly downloads](https://badgen.net/npm/dm/webnwb)](https://npmjs.ccom/package/webnwb)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Discord](https://img.shields.io/badge/community-discord-7289da.svg?sanitize=true)](https://discord.gg/CDxskSh9ZB)


`webnwb` is a library for reading and writing Neurodata without Borders (NWB) files on the web. It uses [h5wasm] to parse HDF5 files.

## Features
- 🔬 Read data from NWB files based on the included specification.
- ⚒️ Use helper functions like `addAcquisition`, `getAcquisition`, and `createAcquisition` to quickly interact with data.
- ⚡ Lazy-load large files (e.g. from the NIH Brain Initiative’s [Distributed Archives for Neurophysiology Data Integration (DANDI)](https://gui.dandiarchive.org/#/)).

## Getting Started
### File Creation Mode
To create a new NWB file, create an `NWBFile` instance using the API handle interactions: 
```javascript
import nwb from 'webnwb'

const now = Date.now()

// Instantiate the NWB File
const newFile = new nwb.NWBFile({
    sessionDescription: 'demonstrate NWBFile basics',
    identifier: 'NWB123',
    sessionStartTime: now,
    fileCreateDate: now,
})

// Create dummy timeseries data
const timestamps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const data = Array.from(timestamps, e => 100 + e * 10)
newFile.addAcquisition({
    name: 'testTimeseries', 
    data: data, 
    units: 'm',
    timestamps
})
```

To save the file, you'll need an `NWBHDF5IO` instance to handle interactions with the underlying [h5wasm] API:
```javascript
import nwb from 'webnwb'
const io = new nwb.NWBHDF5IO()
io.write(file, 'my_file.nwb')
```

### File Access Mode
Accessing an existing file allows you to proxy the underlying [h5wasm] API.

```javascript
const file = io.read('my_file.nwb')
const timeseries = file.acquisition['testTimeseries']
console.log(timeseries.fileId)
```

### Streaming Mode
Streaming mode allows you to lazy-load data from a file without loading the entire file into memory. This is useful for large files, like those hosted on [DANDI](https://gui.dandiarchive.org/#/).

```javascript
const streamed = io.stream('https://example.com/my_file.nwb')
```

These files require you to await properties, as they are not loaded until you request them.

```javascript
const acquisition = await streamed.acquisition
const timeseries = await acquisition['testTimeseries']
```

## Contributing
The essential features of the WebNWB API are aggregated in the [api.ts](./src/api.ts) file, which configures [hdf5-io] to process the underlying HDF5 file in a way that conforms with the NWB Schema.

Anyone who would like to contribute to the acceptance of `webnwb` as an official NWB API is welcome to message[Garrett Flynn](mailto:garrettmflynn@gmail) to coordinate work on the following areas (or anything else you think will be useful):

#### Read Access
1. Use getters to access / update original HDF5 contents (that can then be written), including metadata such as `size` and `false`
2. Handle links
3. Handle references
4. Handle tables with reference

#### Write Access
1. Validate writing a dataset using [best practices](https://www.nwb.org/best-practices/) and the [schema](https://nwb-schema.readthedocs.io/en/latest/format_description.html#nwbcontainer-nwbdata-nwbdatainterface-base-neurodata-types-for-containers-and-datasets)
2. Allow writing a dataset in place using the File Access API (Chrome)
3. Support the Zarr backend

#### Documentation
1. Demonstrate in the documentation with [tutorials](https://pynwb.readthedocs.io/en/latest/tutorials/general/scratch.html#raw-data) and a viewer like [Vizarr](https://github.com/hms-dbmi/vizarr)

## Derivative Packages
- [hdf5-io](https://github.com/garrettmflynn/hdf5-io): Load HDF5 files as JavaScript objects
- [apify](./src/apify/index.ts): A way to generate APIs from simple specification languages (e.g. the NWB Schema)
- [dandi](./src/dandi/index.ts): A basic API for making calls to the DANDI REST API.

## Acknowledgments
Since January 2023, the development of **WebNWB** has been generously supported by a contract from the [Kavli Foundation](https://kavlifoundation.org/). The basic API was originally prototyped as part of the [2022 NWB-DANDI Remote Developer Hackathon](https://neurodatawithoutborders.github.io/nwb_hackathons/HCK12_2022_Remote/) and refined during the [2022 NWB User Days](https://neurodatawithoutborders.github.io/nwb_hackathons/HCK13_2022_Janelia/) event by [Garrett Flynn](https://github.com/garrettmflynn) from [Brains@Play](https://github.com/brainsatplay).


h5wasm: https://github.com/usnistgov/h5wasm
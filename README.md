# WebNWB
Neurodata without Borders — directly on the browser.

[![Npm package version](https://badgen.net/npm/v/webnwb)](https://npmjs.com/package/webnwb)
[![Npm package monthly downloads](https://badgen.net/npm/dm/webnwb)](https://npmjs.ccom/package/webnwb)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Discord](https://img.shields.io/badge/community-discord-7289da.svg?sanitize=true)](https://discord.gg/CDxskSh9ZB)


`webnwb` is a library for reading and writing Neurodata without Borders (NWB) files on the web. It uses [h5wasm](https://github.com/usnistgov/h5wasm) to parse HDF5 files.

## Features
- 🔬 Read data from NWB files based on the included specification.
- ⚒️ Use helper functions like `addAcquisition`, `getAcquisition`, and `createAcquisition` to quickly interact with data.
- ⚡ Lazy-load large files (e.g. from the NIH Brain Initiative’s [Distributed Archives for Neurophysiology Data Integration (DANDI)](https://gui.dandiarchive.org/#/)).


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
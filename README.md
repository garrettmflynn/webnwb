# WebNWB
Neurodata without Borders — directly on the browser.

[![Npm package version](https://badgen.net/npm/v/webnwb)](https://npmjs.com/package/webnwb)
[![Npm package monthly downloads](https://badgen.net/npm/dm/webnwb)](https://npmjs.ccom/package/webnwb)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Discord](https://img.shields.io/badge/community-discord-7289da.svg?sanitize=true)](https://discord.gg/CDxskSh9ZB)

`webnwb` is a library for reading and writing Neurodata without Borders (NWB) files on the web.

## Features
- 🔬 Read data from NWB files based on the included specification.
- ⚡ Lazy-load large files (e.g. from the NIH Brain Initiative’s [Distributed Archives for Neurophysiology Data Integration (DANDI)](https://gui.dandiarchive.org/#/)).
- 📦 Create NWB files from scratch.
- ⚒️ Use helper functions like `addAcquisition`, `getAcquisition`, and `createAcquisition` to quickly write data to new and existing NWB files.

> **Note:** While the read access is stable, write access still experimental and not well-documented. Future version of WebNWB will use the same syntax—but will likely re-implement many of the underlying write functions. Please see the [Contributing](#contributing) section for more information.

## Documentation
Visit [nwb.brainsatplay.com](https://nwb.brainsatplay.com) for documentation and examples.

## Contributing
The essential features of the WebNWB API are aggregated in the [api.ts](./src/api.ts) file, which configures [hdf5-io] to process the underlying HDF5 file in a way that conforms with the NWB Schema.

Anyone who would like to contribute to the acceptance of `webnwb` as an official NWB API is welcome to message[Garrett Flynn](mailto:garrettmflynn@gmail) to coordinate work on the following areas (or anything else you think will be useful):

1. Validate writing a dataset using [best practices](https://www.nwb.org/best-practices/) and the [schema](https://nwb-schema.readthedocs.io/en/latest/format_description.html#nwbcontainer-nwbdata-nwbdatainterface-base-neurodata-types-for-containers-and-datasets)
2. Allow writing a dataset in place using the File Access API (Chrome)
3. Support Zarr as a backend file format

## Derivative Packages
- [hdf5-io](https://github.com/garrettmflynn/hdf5-io): Load HDF5 files as JavaScript objects using [h5wasm].
- [apify](./src/apify/index.ts): A way to generate APIs from simple specification languages (e.g. the NWB Schema)
    - [esconform](https://github.com/garrettmflynn/esconform): A generic library for enforcing schema properties
- [dandi](./src/dandi/index.ts): A basic API for making calls to the DANDI REST API.

## Known Issues
1. `.specloc` is not rewritten as an object reference
2. Since there isn't a file mode that allows overwriting existing properties, we have to create an entire new file representation when saving—and attributes are not written with the exact same type as they were at the beginning (e.g. from 64-bit floating-point to 32-bit integer). **Is this a problem?**
3. Sometimes we get a **memory overload error** before the file is completely written. This leads to partial rewrites...
    - Some of these issues might be resolved by moving to the [WorkerFS filesystem](https://github.com/usnistgov/h5wasm/issues/40#issuecomment-1336314071) and uniformly making the API asynchronous.
4. **Links, references, and tables (with references) are not yet supported.**
5. **Cannot save multidimensional arrays** like the data property in a SpatialSeries.
5. **Timestamp arrays can't be written** (e.g. `timestamps` in a TimeSeries) because they are trying to convert to a BigInt by `h5wasm`.
6. The Node.js filesystem calls did not work through `h5wasm` directly, so they had to be created in `hdf5-io`. 
    - This might just be an issue with esbuild that has been addressed in [Issue #31](https://github.com/usnistgov/h5wasm/issues/31)

## Acknowledgments
Since January 2023, the development of **WebNWB** has been generously supported by a contract from the [Kavli Foundation](https://kavlifoundation.org/). The basic API was originally prototyped as part of the [2022 NWB-DANDI Remote Developer Hackathon](https://neurodatawithoutborders.github.io/nwb_hackathons/HCK12_2022_Remote/) and refined during the [2022 NWB User Days](https://neurodatawithoutborders.github.io/nwb_hackathons/HCK13_2022_Janelia/) event by [Garrett Flynn](https://github.com/garrettmflynn) from [Brains@Play](https://github.com/brainsatplay).


h5wasm: https://github.com/usnistgov/h5wasm
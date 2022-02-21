# WebNWB
Neurodata without Borders — directly on the browser.

![status](https://img.shields.io/npm/v/webnwb) 
![downloads](https://img.shields.io/npm/dt/webnwb)
![lic](https://img.shields.io/npm/l/webnwb)

> Note: Pending integration into the NIH Brain Initiative’s [Distributed Archives for Neurophysiology Data Integration (DANDI)](https://gui.dandiarchive.org/#/).

## Development Progress + Backlog
https://docs.google.com/document/d/1qGuBUHIRhal0d4DLK3urtj9YU6lTt8CddRkqCF-faQg/edit#

### Additional Tasks
- Differentiate Datasets and Groups
- Handle links, references, and tables with reference
- Implement write using [best practices](https://www.nwb.org/best-practices/) and the [schema](https://nwb-schema.readthedocs.io/en/latest/format_description.html#nwbcontainer-nwbdata-nwbdatainterface-base-neurodata-types-for-containers-and-datasets)
- Demonstrate in the documentation with [tutorials](https://pynwb.readthedocs.io/en/latest/tutorials/general/scratch.html#raw-data)


## Dependencies
**h5wasm:** https://github.com/usnistgov/h5wasm
> Note: [h5wasm](https://github.com/usnistgov/h5wasm) was difficult to bundle with Rollup, so it's required as an argument to the `nwb.NWBHDF5IO` class.

**YAML Loaders:** [Rollup](https://www.npmjs.com/package/@rollup/plugin-yaml), [Webpack](https://github.com/eemeli/yaml-loader)

## Acknowledgments
**WebNWB** was originally prototyped as part of the [2022 NWB-DANDI Remote Developer Hackathon](https://neurodatawithoutborders.github.io/nwb_hackathons/HCK12_2022_Remote/) by Garrett Flynn (gflynn@usc.edu), with help from Chandhana Sathishkumar (chandhanasathishkumar@gmail.com) and Emilio Bazan (Asim-v).

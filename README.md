# jsnwb
A JavaScript API for working with Neurodata stored in the NWB Format

> Note: I was unable to bundle [h5wasm](https://github.com/usnistgov/h5wasm) with Rollup, so it is required as an argument to the `jsnwb.NWBHDF5IO` class.


## To Do
https://nwb-schema.readthedocs.io/en/latest/

> Note: API Generation fails on the calcium imaging example.

## References
- **File and Module Format:** https://pynwb.readthedocs.io/en/stable/overview_nwbfile.html#modules-overview
- **Tutorials:** https://pynwb.readthedocs.io/en/stable/tutorials/index.html#domain-specific-tutorials
- **Inspector:** https://github.com/NeurodataWithoutBorders/nwbinspector
- **NIRS Extension:** https://github.com/agencyenterprise/ndx-nirs


## Dependencies
- **h5wasm:** https://github.com/usnistgov/h5wasm


## Acknowledgments
**jsnwb** was originally prototyped as part of the [2022 NWB-DANDI Remote Developer Hackathon](https://neurodatawithoutborders.github.io/nwb_hackathons/HCK12_2022_Remote/) by a large team of contributors, including;
- Garrett Flynn (gflynn@usc.edu)
- Chandhana Sathishkumar (chandhanasathishkumar@gmail.com)
- Emilio Bazan (Asim-v)
# Getting Started with WebNWB
The [NWB:N] format is a powerful standard for storing and sharing neurophysiology data. Both users and developers typically interact with the NWB:N format through Python or MATLAB APIs, However, these can be difficult to use for non-programmers and are not well-suited for simple web applications—requiring complicated distribution environments (e.g. [NWB Explorer], [NWB GUIDE]) for simple interactions. This limits the accessibility of NWB:N data and derivative tools.

`webnwb` is a JavaScript library designed to provide the optimal experience for **exploring and editing NWB file metadata** on the web. 
- 🔬 Read data from NWB files based on the included specification.
- ⚡ Lazy-load large files (e.g. from the NIH Brain Initiative’s [Distributed Archives for Neurophysiology Data Integration (DANDI)](https://gui.dandiarchive.org/#/)).
- 📦 Create NWB files from scratch.
- ⚒️ Use helper functions like `addAcquisition`, `getAcquisition`, and `createAcquisition` to quickly write data to new and existing NWB files.

### Related Tools
Several tools can be used with `webnwb` to provide a cohesive experience for web developers and users alike:
- [nwbwidgets] (Python) provides a comprehensive GUI for visualizing the data in NWB files.
- `easynwb` provides an intuitive interface for creating and editing NWB files.
- `dandi` provides an API for sharing NWB files.
- `nwb-inspector` provides a way to check the compliance of NWB Files with best practices, identical to the [Python version](https://github.com/NeurodataWithoutBorders/nwbinspector).

## Does WebNWB Have An API Reference?
As much as possible, `webnwb` mirrors the [PyNWB] API. 

However, there are a few exceptions to note:
- Methods are implemented in camel case (e.g. `nwbfile.add_acquisition` becomes `nwbfile.addAcquisition`)

## The Road Ahead
The following sections provide a brief overview of the `webnwb` API in practice. 

If you would like to gain a comprehensive understanding of the capabilities of NWB tools, we recommend referring to the [PyNWB] documentation.

[pynwb]: https://pynwb.readthedocs.io/en/stable/
[nwbwidgets]: https://github.com/NeurodataWithoutBorders/nwbwidgets

[NWB:N]: https://www.nwb.org/
[NWB Explorer]: http://nwbexplorer.opensourcebrain.org/hub/spawn-pending/d6206910-b0e6-4755-a6dc-d0a16928cf6f
[NWB GUIDE]: https://github.com/NeurodataWithoutBorders/nwb-guide
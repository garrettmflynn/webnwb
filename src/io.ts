import NWBAPI from './api';
// import HDF5IO from '../../hdf5-io/src/index';
import HDF5IO from 'hdf5-io/dist/index.esm';

export default class NWBHDF5IO extends HDF5IO {

  apis: Map<string, NWBAPI> = new Map()
  _path = "/nwb"
  _extension = "nwb"
  _mimeType = "application/x-nwb"

  constructor(debug = false) {
    super({ debug })
    this.initFS()
  }

  __postprocess = (info: any, transformToSnakeCase = true) => {
    const version = info.nwb_version ?? 'latest'
    let api = this.apis.get(version) ?? new NWBAPI(info.specifications, this._debug) // Get / Create the API
    this.apis.set(api._version ?? api._latest, api) // Store the API


    // Output a file object
    if (api.NWBFile) return new api.NWBFile(info, { transformToSnakeCase })
    else {
      console.warn('Failed to create an NWBFile class on the API. Outputting the raw file structure instead.')
      return info
    } 
  }

 
}
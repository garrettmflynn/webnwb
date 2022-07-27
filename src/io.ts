// import * as reader from "h5wasm";
import NWBAPI from './api';
import HDF5IO from './hdf5';
// import HDF5IO from 'hdf5-io';
import * as caseUtils from './utils/case'

export default class NWBHDF5IO extends HDF5IO {


  apis: Map<string, NWBAPI> = new Map()
  _path: string = "/nwb"

  constructor(h5wasm: any, debug = false) {
    super(h5wasm, {}, debug )
    this.initFS()
  }

  _preprocess = (file: any) => {
    
      // Immediately Grab Version + Specification
      const version = file.read.attrs['nwb_version'] ?? {value: 'latest'} // Fallback to Latest
      const keys = file.read.keys()
      const specifications = (keys.includes('specifications')) ? this._parse(file.read.get('specifications'), {res:{}}, 'res', {}, false) : undefined
      let api = this.apis.get(version.value) ?? new NWBAPI(specifications, this._debug)
      this.apis.set(api._version ?? api._latest, api)   

      // Parse All Information (fallback to object aggregation if no api)
      if (!api?.NWBFile) console.warn('API generation failed. Will parse the raw file structure instead.')

      return api // Return API as a modifier for _parse
  }

  _postprocess = (info: any) => {
    delete info['.specloc']
    console.log(this.apis, info.nwbVersion, info)
    const api = this.apis.get(info.nwbVersion)
    const newInfo = caseUtils.setAll(info) // transform to camelCase

    console.log('api', api, newInfo)
    return (api) ? new api.NWBFile(newInfo) : newInfo // create correct version
  }

 
}
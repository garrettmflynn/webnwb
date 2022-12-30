import NWBAPI from './api';
import HDF5IO from './hdf5';

export default class NWBHDF5IO extends HDF5IO {

  apis: Map<string, NWBAPI> = new Map()
  _path = "/nwb"
  _extension = "nwb"
  _mimeType = "application/x-nwb"

  constructor(debug = false) {
    super({}, debug )
    this.initFS()
  }

  // Overwrite preprocessing method
  _preprocess = (file: any) => {
    
      // Immediately Grab Version + Specification
      const version = file.read.attrs['nwb_version'] ?? {value: 'latest'} // Fallback to Latest
      const keys = file.read.keys()
      const specifications = (keys.includes('specifications')) ? this.parse(file.read.get('specifications'), {res:{}}, 'res', {}, false) : undefined
      let api = this.apis.get(version.value) ?? new NWBAPI(specifications, this._debug)
      this.apis.set(api._version ?? api._latest, api)   

      // Parse All Information (fallback to object aggregation if no api)
      if (!api?.NWBFile) console.warn('API generation failed. Will parse the raw file structure instead.')

      return api // Return API as a modifier for _parse
  }

  // Overwrite postprocessing method
  _postprocess = (info: any) => {
    delete info['.specloc']

    const version = info.nwbVersion ?? info.nwb_version
    const api = this.apis.get(version) as NWBAPI // get correct version
    const specInfo = api._conformToSpec('NWBFile', info)
    return new api.NWBFile(specInfo) // create correct version
  }

 
}
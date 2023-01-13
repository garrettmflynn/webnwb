import NWBAPI from './api';
import HDF5IO from '../../hdf5-io/src/index';

export default class NWBHDF5IO extends HDF5IO {

  apis: Map<string, NWBAPI> = new Map()
  _path = "/nwb"
  _extension = "nwb"
  _mimeType = "application/x-nwb"

  constructor(debug = false) {
    super({ debug })
    this.initFS()
  }

  // Overwrite preprocessing method
  _preprocess = (file: any) => {
    
      // Immediately Grab Version + Specification
      const version = file.reader.attrs['nwb_version'] ?? {value: 'latest'} // Fallback to Latest
      const keys = file.reader.keys()
      const specifications = (keys.includes('specifications')) ? this.parse(file.reader.get('specifications'), {res:{}}, 'res', {}, false) : undefined
      
      // Create NWB API
      let api = this.apis.get(version.value) ?? new NWBAPI(specifications, this._debug)

      // Store API Version
      this.apis.set(api._version ?? api._latest, api)   

      // Parse All Information (fallback to object aggregation if no api)
      if (!api?.NWBFile) console.warn('API generation failed. Will parse the raw file structure instead.')

      return api // Return API as a modifier for _parse
  }

  // Overwrite postprocessing method
  _postprocess = (info: any) => {
    delete info['.specloc']

    const version = info.nwb_version // Before transformation
    const api = this.apis.get(version) as NWBAPI // get correct version
    const specInfo = api._conformToSpec('NWBFile', info)
    return new api.NWBFile(specInfo) // create correct version
  }

 
}
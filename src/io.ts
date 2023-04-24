import NWBAPI from './api';
import HDF5IO, { IOInput } from 'hdf5-io';

export default class NWBHDF5IO extends HDF5IO {

  apis: Map<string, NWBAPI> = new Map()

  constructor(options: IOInput = {}) {
    super({ 
      ...options, 
      path: "/nwb",
      extension: "nwb",
      mimeType: "application/x-nwb",
      postprocess: async function (info: any, transformToSnakeCase = true) {
        const specifications = await this.resolveStream(info.specifications) // Pre-resolve the specifications
        const version = info.nwb_version ?? 'latest'
        let api = this.apis.get(version) ?? new NWBAPI(specifications, options.debug) // Get / Create the API | NOTE: Allow for the IO debug flag to be passed to the API
        this.apis.set(api._version ?? api._latest, api) // Store the API
        if (api.NWBFile) return new api.NWBFile(info, { transformToSnakeCase })
        else {
          console.warn('Failed to create an NWBFile class on the API. Outputting the raw file structure instead.')
          return info
        } 
      }
    })

    this.initFS() // Start initializing the file system
  }
}
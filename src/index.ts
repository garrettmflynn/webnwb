// import * as reader from "h5wasm";
import { NWBFile } from './file';
import { ArbitraryObject, AttributeType, GroupType, LinkType, DatasetType } from './types/general.types';
// import { TimeSeries } from './base';


type SpecificationType = {'core':ArbitraryObject} & ArbitraryObject
// API Generator
// Generates the NWB API from included specifications
export class API {

  specifications: SpecificationType
  NWBFile?: ArbitraryObject;
  debug: boolean;
  _namespaceToSchema: ArbitraryObject = {};
  [x: string]: any;

  constructor(specifications: SpecificationType, debug=false) {
    this.debug = debug
    this.specifications = specifications
    this._generateCore(specifications.core)

    for (let key in specifications) if (key !== 'core') console.warn(`${key} specification ignored.`)
  }


  _inherit = (namespace: string, key:string, parentObject?:ArbitraryObject) => {
    const schema = this._namespaceToSchema[namespace][key]
    if (!parentObject) parentObject = this[schema]

    if (parentObject){
      const o = parentObject[key]

      const inheritedName = o.inherits
      const inheritedSchema = this._namespaceToSchema[namespace][inheritedName]
      const inherit = (inheritedSchema) ? this[inheritedSchema][inheritedName] : undefined
      delete parentObject[key].inherits

      if (inherit) {
        if (inherit.inherits) this._inherit(namespace, inheritedName) // Finish inheritance for parent first
        const deep = JSON.parse(JSON.stringify(inherit))
      
        parentObject[key] = Object.assign(deep, o)
      } else if (o.inherits) console.log(`Cannot inherit ${inheritedName}`, o, namespace, schema, key)

      // Drill Into Objects
      if (typeof parentObject[key] === 'object')for (let k in parentObject[key]) this._inherit(namespace, k, parentObject[key])
    }
  }
  

  _setFromObject(o: any, aggregator: ArbitraryObject = {}) {

    const name = o.neurodata_type_def ?? o.name ?? o.default_name
    const inherit = o.neurodata_type_inc

    // console.log(inherit, this.core[inherit])

    if (name) aggregator[name] = o.value ?? o.default_value ?? {}



    // Skip Checking Links
    if (inherit && aggregator[name]) {
      aggregator[name].inherits = inherit
    }


    // Attributes
    if (o.attributes) {
      o.attributes.forEach((attr: AttributeType) => {
        this._setFromObject(attr, aggregator[name] ?? aggregator)
      })
    }

    // Groups
    if (o.groups) {
      o.groups.forEach((group: GroupType) => {
        // console.log('Group', group)
        this._setFromObject(group, aggregator[name] ?? aggregator)
        // aggregator[name][attr.name] = attr.value ?? attr.default_value
      })

    }

    // Links
    if (o.links) {
      o.links.forEach((link: LinkType) => {
        // console.log('Link', link)
        this._setFromObject(link, aggregator[name] ?? aggregator)

        // aggregator[name][attr.name] = attr.value ?? attr.default_value
      })
    }

    // Datasets
    if (o.datasets) {
      o.datasets.forEach((dataset: DatasetType) => {
        // console.log('Dataset', dataset)
        this._setFromObject(dataset, aggregator[name] ?? aggregator)
      })
    }
  }

  _generateCore(o: any = {}) {

    const tick = performance.now()
    const version = Object.keys(o)[0]

    const namespaceInfo = o[version]?.namespace?.value
    if (namespaceInfo){
    const namespace = JSON.parse(namespaceInfo)
    namespace.namespaces.forEach((namespace: any) => {
      this._namespaceToSchema[namespace.name] = {} // Track all generated objects on a flat map
      namespace.schema.forEach((schema: any) => {

        // Grabbing Schema
        if (schema.source) {
          const name = schema.source.replace('nwb.', '')
          this[name] = {}
          const info = JSON.parse(o[version][schema.source].value)

          this._setFromObject(info, this[name])

          // Register Objects
          for (let key in this[name]){
            this._namespaceToSchema[namespace.name][key] = name
          }
        }
      })

      // Ensure All Namespace Objects Inherit from Each Other
      for (let key in this._namespaceToSchema[namespace.name]) {
        this._inherit(namespace.name, key)
      }
    })

    const tock = performance.now()
    if (this.debug) console.log(`Generated core API in ${tock - tick} ms`)
  } else console.warn('NWBJS API: Core unable to be generated from file specifications.')
  }
}



export class NWBHDF5IO {

  reader: any;
  debug: boolean;
  files: Map<string, {
    name: string,
    read?: any,
    write?: any,
    nwb?: NWBFile,
  }> = new Map();

  apis: Map<string, API> = new Map()


  // Note: Must pass an "h5wasm" instance here
  constructor(reader: any, debug = false) {
    this.reader = reader;
    this.debug = debug;
  }

  // ---------------------- New HDF5IO Methods ----------------------

  // Allow Upload of NWB-Formatted HDF5 Files from the Browser
  upload = async (ev: Event) => {
    const input = ev.target as HTMLInputElement;
    if (input.files && input.files?.length) {
      await Promise.all(Array.from(input.files).map(async f => {
        let ab = await f.arrayBuffer();
        await this._write(f.name, ab)
      }))
    }
  }

  list = () => {
    return this.files.keys()
  }

  // Allow Download of NWB-Formatted HDF5 Files fromthe  Browser
  download = (name: string, file: any) => {
    if (!file) file = (name) ? this.files.get(name) : [...this.files.values()][0]
    if (file) {
      if (!name) name = file.name // Get Default Name
      if (file.write) file.write.flush();
      if (file.read) file.read.flush();

      const blob = new Blob([this.reader.FS.readFile(file.name)], { type: 'application/x-hdf5' });
      var a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";

      // IE 10 / 11
      const nav = (globalThis.navigator as any);
      if (nav?.msSaveOrOpenBlob) {
        nav.msSaveOrOpenBlob(blob, name);
      } else {
        var url = globalThis.URL?.createObjectURL(blob);
        a.href = url;
        let nameNoExtension = name.replace(/(.+)\.(.+)/, '$1')
        a.download = nameNoExtension + '.nwb' // Add NWB Extension
        a.target = "_blank";
        //globalThis.open(url, '_blank', fileName);
        a.click();
        setTimeout(function () { globalThis.URL.revokeObjectURL(url) }, 1000);
      }
    }
  }

  // Fetch NWB Files from a URL
  fetch = async (url: string, fileName: string = 'default.nwb', progressCallback: (ratio: number, length: number) => void = () => { }) => {

    //  Get File from Name
    let o = this.files.get(fileName) ?? { nwb: undefined }

    // Only Fetch if NO Locally Cached Version
    if (!o.nwb) {

      const tick = performance.now()

      let response = await fetch(url).then(res => {

        // Use the Streams API
        if (res.body) {
          const reader = res.body.getReader()
          const length = res.headers.get("Content-Length") as any
          let received = 0

          // On Stream Chunk
          const stream = new ReadableStream({
            start(controller) {

              const push = async () => {

                reader.read().then(({ value, done }) => {
                  if (done) {
                    controller.close();
                    return;
                  }

                  received += value?.length ?? 0
                  progressCallback(received / length, length)
                  controller.enqueue(value);
                  push()
                })
              }

              push()
            }
          })

          // Read the Response
          return new Response(stream, { headers: res.headers });
        } else return new Response()
      })


      let ab = await response.arrayBuffer();

      const tock = performance.now()

      if (this.debug) console.log(`Fetched in ${tock - tick} ms`)

      await this._write(fileName, ab)
      o.nwb = this.read(fileName)
    } else if (this.debug) console.log(`Returning cached version.`)
    return o.nwb
  }

  // Iteratively Check FS to Write File
  _write = (name: string, ab: ArrayBuffer) => {
    return new Promise(resolve => {
      const tick = performance.now()

      let check = () => {
        if (this.reader.FS) {
          this.reader.FS.writeFile(name, new Uint8Array(ab));
          const tock = performance.now()
          if (this.debug) console.log(`Wrote raw file in ${tock - tick} ms`)
          resolve(true)
        } else setTimeout(check, 10) // Wait and check again
      }
      check()
    })
  }

  // ---------------------- Core HDF5IO Methods ----------------------
  read = (name = [...this.files.keys()][0]) => {

    let file = this.get(name, 'r')

    if (file?.read?.file_id) {

      const tick = performance.now()

      let api: any = {}

      // Parse File Information with API Knowledge
      let parseGroup = (o: any, aggregator: { [x: string]: any } = {}) => {

        if (o){
        // Set Attributes
        if (o instanceof this.reader.Dataset) {
          if (Object.keys(aggregator)) aggregator.value = o.value
          else aggregator = o.value
        } else if (!o.attrs.value) {
          for (let a in o.attrs) {
            aggregator[a] = o.attrs[a].value // Exclude shape and dType
          }
        }

        // Drill Group
        if (o.keys instanceof Function) {
          let keys = o.keys()
          keys.forEach((k: string) => {
            const group = o.get(k)
            aggregator[k] = parseGroup(group, aggregator[k])
          })
        }
        }

        return aggregator
      }

      // Immediately Grab Version + Specification
      let version = file.read.attrs['nwb_version'].value

      let specifications = parseGroup(file.read.get('specifications'), {})
      if (specifications){
        api = this.apis.get(version) ?? new API(specifications as any, this.debug)
        this.apis.set(version, api)   
      } 

      // Parse All Information (fallback to object aggregation if no api)
      let aggregator = {}
      if (api?.file?.NWBFile) aggregator = JSON.parse(JSON.stringify(api.file.NWBFile))
      else console.warn('API generation failed. Will parse the raw file structure instead.')
      parseGroup(file.read, aggregator)

      file.nwb = new NWBFile(aggregator)

      // if (!file.write) this.close()

      const tock = performance.now()
      if (this.debug) console.log(`Read file in ${tock - tick} ms`)
      return file.nwb

    } else return
  }

  // Get File by Name
  get = (name: string = [...this.files.keys()][0], mode?: string) => {

    let o = this.files.get(name)

    if (!o) {
      o = { name, nwb: undefined }
      this.files.set(name, o)
    }

    if (mode) {
      let hdf5 = new this.reader.File(name, mode);
      if (mode === 'w') o.write = hdf5
      else if (mode === 'r') o.read = hdf5
      else if (mode === 'a') o.read = o.write = hdf5
    }

    // if (o.hdf5.fileId) 
    return o
    // else throw 'File does not exist.'
  }

  write = (o: NWBFile, name = [...this.files.keys()][0]) => {

    let file = this.get(name, 'w')

    if (file?.write?.file_id) {

      const tick = performance.now()

      // Write Arbitrary Object to HDF5 File
      let writeObject = (o: any, key?: String) => {

        const group = (key) ? file.write.get(key) : file.write
        for (let k in o) {
          const newKey = `${(key) ? `${key}/` : ''}${k}`
          if (!(o[k] instanceof Function)) {
            if (typeof o[k] === 'object') {
              // if ('data' in o[k]) {
              //   console.log(o[k])
              //   const dataset = group.create_dataset(k, o[k].data);
              //   const o2 = Object.assign({}, o)
              //   delete o2.data
              //  o2[k]['neurodata_type'] = o[k].constructor.name // Grab ClassName as neurodata_type
              //   // writeObject(o2[k], newKey)
              //   for (let k2 in o2[k]){
              //     // console.log('attr', k2, o2[k], o2[k][k2])
              //     if (typeof o2[k][k2] !== 'object') dataset.create_attribute(k2, o2[k][k2]) // TODO: Allow objects to be saved (e.g. options.timestamps)
              //   }
              // } else {
              if (o[k] instanceof Array) group.create_dataset(k, o[k]);
              else {
                file.write.create_group(newKey);
                writeObject(o[k], newKey)
              }
              // }
            } else {
              if (o[k]) group.create_attribute(k, o[k]);
            }
          }
        }
      }

      writeObject(o)

      const tock = performance.now()
      if (this.debug) console.log(`Wrote NWB File object to disk in ${tock - tick} ms`)
    }
  }

  close = (name = [...this.files.keys()][0]) => {
    const fileObj = this.files.get(name)
    if (fileObj) {
      if (fileObj.read) fileObj.read.close()
      if (fileObj.write) fileObj.write.close()

      this.files.delete(name)
    }
  }
}

// import * as __io from './io'
// export * from './core'
// export * from './base'
// export * from './file'

// import * as behavior from './behavior'
// import * as device from './device'
// import * as ecephys from './ecephys'
// import * as epoch from './epoch'
// import * as icephys from './icephys'
// import * as image from './image'
// import * as misc from './misc'
// import * as ogen from './ogen'
// import * as ophys from './ophys'
// import * as retinotopy from './retinotopy'

// export {
//   __io,
//   behavior,
//   device,
//   ecephys,
//   epoch,
//   icephys,
//   image,
//   misc,
//   ogen,
//   ophys,
//   retinotopy
// }

export default NWBHDF5IO
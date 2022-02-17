// import * as reader from "h5wasm";
import NWBAPI from './api';
import { ArbitraryObject } from './types/general.types';

type NWBFile = any

export default class NWBHDF5IO {

  h5wasm: any;
  files: Map<string, {
    name: string,
    read?: any,
    write?: any,
    nwb?: NWBFile, // Custom NWB File Format
  }> = new Map();

  apis: Map<string, NWBAPI> = new Map()
  _path: string = "/home/nwb"
  _debug: boolean;


  constructor(h5wasm: any, debug = false) {
    this.h5wasm = h5wasm;
    this._debug = debug;

    // Create a local mount of the IndexedDB filesystem:
    this.initFS()
  }

  initFS = (path=this._path) => {
    this.h5wasm.FS.mkdir(path);
    this.h5wasm.FS.chdir(path);

    this._FSReady().then(async () => {
      try {
        this.h5wasm.FS.mount(this.h5wasm.FS.filesystems.IDBFS, {}, path)
        if (this._debug) console.log(`Mounted IndexedDB filesystem to ${this._path}`)
        this.syncFS(true, path)
      } catch (e) {
        switch(e.errno){
          case 44: 
            console.warn('Path does not exist');
            break;
          case 10:
            console.warn(`Filesystem already mounted at ${this._path}`);
            console.log('Active Filesystem', await this.list(path))
            break;
          default: 
            console.warn('Unknown filesystem error', e);
        }
      }
    })
  }
 
  syncFS = (read:boolean= false, path=this._path) => {
    this._FSReady().then(async () => {
      if (this._debug && read) console.log(`Pushing all current files in ${this._path} to IndexedDB`)
      this.h5wasm.FS.syncfs(read, (e?:Error) => {
        if (e) console.error(e)
        else {
          if (this._debug)  {
            if (read) console.log(`IndexedDB successfully read into ${this._path}!`)
            else console.log(`All current files in ${this._path} pushed to IndexedDB!`)
          }
          this.list(path).then(res => console.log('Active Filesystem', res))
        }
      })
    })
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

  list = async (path:string=this._path) => {
    await this._FSReady()
    let node;

    try {node = (this.h5wasm.FS.lookupPath(path))?.node} 
    catch (e) {console.warn(e)}

    if (node?.isFolder && node.contents) {
        let files = Object.values(node.contents).filter((v:any) => !(v.isFolder)).map((v:any) => v.name);
        // const subfolders = Object.values(node.contents).filter((v:any) => (v.isFolder)).map((v:any) => v.name)
        // Add Files to Registry
        files.forEach((name: string) => {
          if (!this.files.has(name)) this.files.set(name, {name, nwb: undefined}) // undefined === capable of being loaded
        })
        return files
    }
    else return []
}

  // Allow Download of NWB-Formatted HDF5 Files fromthe  Browser
  download = (name: string, file: any) => {
    if (!file) file = (name) ? this.files.get(name) : [...this.files.values()][0]
    if (file) {
      if (!name) name = file.name // Get Default Name
      if (file.write) file.write.flush();
      if (file.read) file.read.flush();

      const blob = new Blob([this.h5wasm.FS.readFile(file.name)], { type: 'application/x-hdf5' });
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
  fetch = async (
    url: string, 
    fileName: string = 'default.nwb', 
    progressCallback: (ratio: number, length: number) => void = () => { }, 
    successCallback: (fromRemote: boolean) => void = () => { }
  ) => {

    //  Get File from Name
    let o = this.get(fileName) ?? { nwb: undefined }

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
                    successCallback(true)
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

      if (this._debug) console.log(`Fetched in ${tock - tick} ms`)

      await this._write(fileName, ab)
      o.nwb = this.read(fileName)

    } successCallback(false)
    return o.nwb
  }

  // Iteratively Check FS to Write File
  _write = async (name: string, ab: ArrayBuffer) => {
      const tick = performance.now()
      await this._FSReady()
      this.h5wasm.FS.writeFile(name, new Uint8Array(ab));
      const tock = performance.now()
      if (this._debug) console.log(`Wrote raw file in ${tock - tick} ms`)
      return true
  }

  _FSReady = () => {
    return new Promise(resolve => {
      if (this.h5wasm.FS) resolve(true)
      else setTimeout(async () => resolve(await this._FSReady()), 10) // Wait and check again
    })
  }

  // ---------------------- Core HDF5IO Methods ----------------------
  read = (name = [...this.files.keys()][0]) => {

    let file = this.get(name, 'r')

    if (Number(file?.read?.file_id) != -1) {

      const tick = performance.now()

      let api: any = {}

      // Parse File Information with API Knowledge
      let parseGroup = (o: any, aggregator: { [x: string]: any } = {}, key: string, keepDatasets:boolean = true) => {

        if (o){
        // Set Attributes
        if (o instanceof this.h5wasm.Dataset) {
          if (Object.keys(aggregator[key])) {
            // ToDO: Expose HDF5 Dataset objects
            // if (keepDatasets) aggregator[key] = o // Expose HDF5 Dataset
            // else 
            aggregator[key] = o.value
          }
          else aggregator[key] = o.value

          
        } else if (!o.attrs.value) {
          for (let a in o.attrs) {
            aggregator[key][a] = o.attrs[a].value // Exclude shape and dType
          }
        }

        // Drill Group
        if (o.keys instanceof Function) {
          let keys = o.keys()
          keys.forEach((k: string) => {
            const group = o.get(k)
            aggregator[key][k] = {}
            aggregator[key][k] = parseGroup(group, aggregator[key], k, keepDatasets)
          })
        }
        }

        return aggregator[key]
      }

      // Immediately Grab Version + Specification
      let version = file.read.attrs['nwb_version'].value

      let specifications = parseGroup(file.read.get('specifications'), {res:{}}, 'res', false)
      if (specifications){
        api = this.apis.get(version) ?? new NWBAPI(specifications as any, this._debug)
        this.apis.set(version, api)   
      } 

      // Parse All Information (fallback to object aggregation if no api)
      let aggregator:ArbitraryObject = {res: {}}
      if (!api?.NWBFile) console.warn('API generation failed. Will parse the raw file structure instead.')
      parseGroup(file.read, aggregator, 'res')


      // Create NWB File
      delete aggregator.res['.specloc']
      file.nwb = new api.NWBFile(aggregator.res)

      // if (!file.write) this.close()

      const tock = performance.now()
      if (this._debug) console.log(`Read file in ${tock - tick} ms`)
      return file.nwb

    } else return
  }

  // Get File by Name
  get = (name: string = [...this.files.keys()][0], mode?: string) => {

    let o = this.files.get(name)

    if (!o) {
      o = { name, nwb: null }
      this.files.set(name, o)
    }

    if (mode) {
      let hdf5 = new this.h5wasm.File(name, mode);
      if (mode === 'w') o.write = hdf5
      else if (mode === 'r') o.read = hdf5
      else if (mode === 'a') o.read = o.write = hdf5
    } else if (name && o.nwb === undefined) {
      if (this._debug) console.log(`Returning local version from ${this._path}`)
      this.read(name)
    }

    return o
  }

  save = () => this.syncFS(false)

  write = (o: NWBFile, name = [...this.files.keys()][0]) => {

    let file = this.get(name, 'w')
    
    if (Number(file?.write?.file_id) != -1) {

      const tick = performance.now()

      // Write Arbitrary Object to HDF5 File
      let writeObject = (o: any, key?: String) => {
        const group = (key) ? file.write.get(key) : file.write
        for (let k in o) {
          const newKey = `${(key) ? `${key}/` : ''}${k}`
          if (!(o[k] instanceof Function)) {
            if (typeof o[k] === 'object') {
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
      if (this._debug) console.log(`Wrote NWB File object to browser filesystem in ${tock - tick} ms`)
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
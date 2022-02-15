// import * as reader from "h5wasm";
import { NWBFile } from './file';
// import { TimeSeries } from './base';

export class NWBHDF5IO {

  reader: any;
  debug: boolean;
  files: Map<string, {
    name: string,
    read?: any,
    write?: any,
    nwb: NWBFile,
  }> = new Map();


  // Note: Must pass an "h5wasm" instance here
  constructor(reader:any, debug=false) {
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
  download = (name:string, file:any) => {
    if (!file) file = (name) ? this.files.get(name) : [...this.files.values()][0]
    if (file){
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
  fetch = async (url: string, name:string = 'default.nwb', progressCallback: (ratio: number, length: number) => void = () => { }) => {
    
    //  Get File from Name
    let {nwb} = this.files.get(name) ?? {}

    // Only Fetch if NO Locally Cached Version
    if (!nwb){

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

    await this._write(name, ab)
    nwb = this.read(name)
  } else if (this.debug) console.log(`Returning cached version.`)
    return nwb
  }

  // Iteratively Check FS to Write File
  _write = (name:string, ab: ArrayBuffer) => {
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
  read = (name=[...this.files.keys()][0]) => {

    let file = this.get(name, 'r')

    if (file?.read?.file_id) {

      const tick = performance.now()


        let parseGroup = (o: any, aggregator: { [x: string]: any } = {}) => {

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

          return aggregator
        }

        parseGroup(file.read, file.nwb)

        // if (!file.write) this.close()

        const tock = performance.now()
        if (this.debug) console.log(`Read file in ${tock - tick} ms`)
        return file.nwb

    } else return
  }

  // Get File by Name
  get = (name:string = [...this.files.keys()][0], mode?:string) => {

    let o = this.files.get(name)

    if (!o) {
      o = {name, nwb: new NWBFile()}
      this.files.set(name, o)
    }

    if (mode){
      let hdf5 = new this.reader.File(name, mode);
      if (mode === 'w') o.write = hdf5
      else if (mode === 'r') o.read = hdf5
      else if (mode === 'a') o.read = o.write = hdf5
    }

    // if (o.hdf5.fileId) 
    return o
    // else throw 'File does not exist.'
  }

  write = (o: NWBFile, name=[...this.files.keys()][0]) => {

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

  close = (name=[...this.files.keys()][0]) => {
    const fileObj = this.files.get(name)
    if (fileObj){
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
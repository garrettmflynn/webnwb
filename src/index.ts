import * as hdf5 from "h5wasm";
import { FileMethods } from './types/general.types';
import { NWBFile } from './file';
// import { TimeSeries } from './base';

export class NWBHDF5IO {

  hdf5?: any;
  file?: NWBFile;
  name: string;
  mode: FileMethods;

  constructor(name:string, mode:FileMethods = "r") {
    this.name = name
    this.mode = mode
  }

  // ---------------------- New HDF5IO Methods ----------------------
  
  // Allow Upload of NWB-Formatted HDF5 Files from the Browser
  upload = async (ev:Event) => {
    const input = ev.target as HTMLInputElement;
    if (input.files && input.files?.length) {
      await Promise.all(Array.from(input.files).map(async f => {
        this.name = f.name
        let ab = await f.arrayBuffer();
        await this._write(ab)
      }))
    }
  }

  // Allow Download of NWB-Formatted HDF5 Files fromthe  Browser
  download = (file = this.hdf5, name=file.filename) => {
    file.flush();
    const blob = new Blob([hdf5.FS.readFile(file.filename)], {type: 'application/x-hdf5'});
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
        let nameNoExtension = name.split('.')?.pop()
        a.download = nameNoExtension + '.nwb' // Add NWB Extension
        a.target = "_blank";
        //globalThis.open(url, '_blank', fileName);
        a.click();
        setTimeout(function () { globalThis.URL.revokeObjectURL(url) }, 1000);
    }
  }

  // Fetch NWB Files from a URL
  fetch = async (url:string) => {
    let response = await fetch(url);
    let ab = await response.arrayBuffer();

    if (!this.name) {
      const filename = url.split('/').pop()
      if (filename) this.name = filename.split('.')[0]
    }

    await this._write(ab)
    this.file = this.read()
    return this.file
  }

  //Iteratively Check FS to Write File
  _write = (ab:ArrayBuffer) => {
    return new Promise(resolve => {
      if (hdf5.FS) {
        hdf5.FS.writeFile(this.name, new Uint8Array(ab));
        resolve(true)
      } else setTimeout(this._write, 10) // Wait and check again
    })
  }

  // ---------------------- Core HDF5IO Methods ----------------------
  read = () => {
    if (['r','a'].includes(this.mode)){
      this.hdf5 = new hdf5.File(this.name, this.mode);

      this.file = new NWBFile()

      let parseGroup = (o:any, aggregator:{[x:string]:any}={}) => {

        // Set Attributes
        if (!o.attrs.value){
          for (let a in o.attrs){
            aggregator[a] = o.attrs[a].value // Exclude shape and dType
          }
        } 

        // Drill Group
        if (o.keys instanceof Function){
          let keys = o.keys()          
          keys.forEach((k:string) => {
            const group = o.get(k)
            aggregator[k] = parseGroup(group, aggregator[k])
          })
        } 
        
        // Set Dataset
        else if (o instanceof hdf5.Dataset) {
          if (Object.keys(aggregator)) aggregator.value = o.value
          else aggregator = o.value
        }

        return aggregator
      }

      parseGroup(this.hdf5, this.file)

      if (this.mode == 'r') this.hdf5.close()
      return this.file
      } else return
    }

  write = (file: NWBFile) => {
    if (['w','a'].includes(this.mode)){
      this.hdf5 = new hdf5.File(this.name, this.mode);

      // Write Arbitrary Object to HDF5 File
      let writeObject = (o:any, key?:String) => {

        const group = (key) ? this.hdf5.get(key) : this.hdf5
        for (let k in o){
          const newKey = `${(key) ? `${key}/` : ''}${k}`
          if (!(o[k] instanceof Function)){
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
                  this.hdf5.create_group(newKey);
                  writeObject(o[k], newKey)
                }
              // }
            } else {
              group.create_attribute(k, o[k]);
            }
          }
        }
      }

      writeObject(file)
    }
  }

  close = () => {
    if (this.hdf5) this.hdf5.close()
  }
}

import * as __io from './io' 
export * from './core'  
export * from './base'  
export * from './file'  

import * as behavior from './behavior'  
import * as device from './device' 
import * as ecephys from './ecephys'  
import * as epoch from './epoch' 
import * as icephys from './icephys'  
import * as image from './image' 
import * as misc from './misc' 
import * as ogen from './ogen' 
import * as ophys from './ophys' 
import * as retinotopy from './retinotopy' 
// export * as legacy from './legacy' 

export {
  __io,
  behavior ,
  device, 
  ecephys,
  epoch,
  icephys,
  image,
  misc,
  ogen,
  ophys,
  retinotopy
}
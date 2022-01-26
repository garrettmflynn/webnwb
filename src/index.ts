import { File, FS } from "h5wasm";
import { FileMethods } from './types/general.types';
import { NWBFile } from './file';
// import { TimeSeries } from './base';

export class NWBHDF5IO {
  hdf5?: any;
  file?: NWBFile;
  name: string;
  mode: FileMethods
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
        FS.writeFile(this.name, new Uint8Array(ab))
      }))
    }
  }

  // Allow Download of NWB-Formatted HDF5 Files fromthe  Browser
  download = (file = this.hdf5, name=file.filename) => {
    file.flush();
    const blob = new Blob([FS.readFile(file.filename)], {type: 'application/x-hdf5'});
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";

    // IE 10 / 11
    const nav = (window.navigator as any);
    if (nav.msSaveOrOpenBlob) {
        nav.msSaveOrOpenBlob(blob, name);
    } else {
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        let nameNoExtension = name.split('.')?.pop()
        a.download = nameNoExtension + '.nwb' // Add NWB Extension
        a.target = "_blank";
        //window.open(url, '_blank', fileName);
        a.click();
        setTimeout(function () { window.URL.revokeObjectURL(url) }, 1000);
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

    FS.writeFile(this.name, new Uint8Array(ab));
    this.file = this.read()
    return this.file
  }

  // ---------------------- Core HDF5IO Methods ----------------------
  read = () => {
    if (['r','a'].includes(this.mode)){
      this.hdf5 = new File(this.name, this.mode);

      console.log('Raw HDF5', this.hdf5, this.hdf5.keys(), this.hdf5.attrs)
      this.file = new NWBFile()

      let parseGroup = (o:any) => {
        // console.log('Attributes', o.attrs)
        if (o.keys instanceof Function){
          let keys = o.keys()
          // console.log('Keys', keys)
          keys.forEach((k:string) => {
            const group = o.get(k)
            // console.log(k, group)
            parseGroup(group)
          })
        } else {
          // console.log('Dataset', o.value)
        }
      }

      parseGroup(this.hdf5)

      // Get Specifications
      const spec = this.hdf5.get("specifications")
      console.log('spec', spec, spec.keys(), spec.attrs)

        // // Regenerate Acquisition
        // const acquisition = this.hdf5.get("acquisition")
        // console.log(acquisition, acquisition?.keys)
        // if (acquisition) {
        //   const keys = acquisition.keys
        //   if (keys) keys.forEach((str:string) => {
        //     const data = this.hdf5.get(`acquisition/${str}`)
        //     let ts = new TimeSeries(str, data.value, 'm', {})
        //     if (this.file) this.file.addAcquisition(ts)
        //   })
        // }

        // // Regenerate Processing
        // const processing = this.hdf5.get("processing")
        // console.log(processing)
        // console.log(processing, processing?.keys)

        // if (processing) {
        //   const keys = processino.keys
        //   if (keys) keys.forEach((str:string) => {
        //     const group = this.hdf5.get(`processing/${str}`)
        //     const attrs = group.attrs
        //     if (this.file && attrs) this.file.createProcessingModule(attrs.name?.value, attrs.description?.value)
        //   })
        // }

      if (this.mode == 'r') this.hdf5.close()
      return this.file
      } else return
    }

  write = (file: NWBFile) => {
    if (['w','a'].includes(this.mode)){
      this.hdf5 = new File(this.name, this.mode);

      // Save Acquisitions
      this.hdf5.create_attribute("new_attr", "something wicked this way comes");

      this.hdf5.create_group("acquisition");
      for (let key in file.acquisition){
        this.hdf5.get("acquisition").create_dataset(key, file.acquisition[key].data);
      }

      this.hdf5.create_group("processing");
      for (let key in file.processing){
        const o = file.processing[key]
        const group = this.hdf5.create_group(`processing/${key}`);
        group.create_attribute("name", o.name);
        group.create_attribute("description", o.description);
        for (let name in o.dataInterfaces) group.create_dataset(name, [0]); // TOOO: Actually add object
      }
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
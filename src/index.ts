import { File } from "h5wasm";
import { FileMethods } from './types/general.types';
import { NWBFile } from './file';
import { TimeSeries, ProcessingModule } from './base';

export class NWBHDF5IO {
  hdf5?: any;
  file?: NWBFile;
  path: string;
  mode: FileMethods
  constructor(path:string, mode:FileMethods = "r") {
    this.path = path
    this.mode = mode
  }


  read = () => {
    if (['r','a'].includes(this.mode)){
      this.hdf5 = new File(this.path, this.mode);
      this.file = new NWBFile()

        // Regenerate Acquisition
        const acquisition = this.hdf5.get("acquisition")
        if (acquisition) {
          const keys = acquisition.keys()
          keys.forEach((str:string) => {
            const data = this.hdf5.get(`acquisition/${str}`)
            let ts = new TimeSeries(str, data.value, 'm', {})
            if (this.file) this.file.addAcquisition(ts)
          })
        }

        // Regenerate Processing
        const processing = this.hdf5.get("processing")
        if (processing) {
          const keys = processing.keys()
          keys.forEach((str:string) => {
            const group = this.hdf5.get(`processing/${str}`)
            const attrs = group.attrs
            if (this.file) this.file.createProcessingModule(attrs.name?.value, attrs.description?.value)
          })
        }

      if (this.mode == 'r') this.hdf5.close()
      return this.file
      }
    }

  write = (file: NWBFile) => {
    if (['w','a'].includes(this.mode)){
      this.hdf5 = new File(this.path, this.mode);

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
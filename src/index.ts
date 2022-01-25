import * as hdf5 from 'jsfive';
export const get = async (filename:string) => {
    return await fetch(filename, {
        method: 'GET',
        mode: 'cors'
    }).then(function(response:any) { 
        return response.arrayBuffer() 
      })
      .then(function(buffer:any) {
        const f = new hdf5.File(buffer, filename);
        // do something with f;
        console.log(f)
        // let g = f.get('group');
        // let d = f.get('group/dataset');
        // let v = d.value;
        // let a = d.attrs;
        return f
      });
}

// import io as __io from './io' 
// import core from  NWBContainer, NWBData  
// import base from TimeSeries, ProcessingModule
// import file from NWBFile  

// import . from behavior  
// import . from device 
// import . from ecephys  
// import . from epoch 
// import . from icephys  
// import . from image 
// import . from misc 
// import . from ogen 
// import . from ophys 
// import . from retinotopy 
// import . from legacy 
// import hdmf.data_utils from DataChunkIterator  
// import hdmf.backends.hdf5 from H5DataIO 
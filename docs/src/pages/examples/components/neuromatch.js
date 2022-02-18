import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

export default function NeuromatchExample() {

  // HTML Element References
  const load = useRef(null);
  const __ = useRef(null);

  // Path to Local NWB File
  const examplePath = 'https://raw.githubusercontent.com/OpenSourceBrain/NWBShowcase/master/FergusonEtAl2015/FergusonEtAl2015.nwb'

  useEffect(async () => {
    let reader = await import('h5wasm')
    let nwb = await import('../../../../../src')
    if (nwb?.default) nwb = nwb.default

    // Load NWB File
      const io = new nwb.NWBHDF5IO(reader)
      let file = await io.fetch(examplePath)
      console.log('File', file)

      load.current.innerHTML = 'File Loaded'


    // Replicate Neuromatch Examples Here
    // https://compneuro.neuromatch.io/tutorials/intro.html



  }, []);

  return (
    <header className={clsx('hero hero--primary')}>
      <div className="container">
        <h1 className="hero__title">Neuromatch Example</h1>
        <p ref={load}></p>
      </div>
    </header>
  );
}

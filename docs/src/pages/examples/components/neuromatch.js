import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import * as reader from 'h5wasm'

export default function NeuromatchExample() {

  // HTML Element References
  const load = useRef(null);
  const __ = useRef(null);

  // Path to Local NWB File
  const examplePath = '../../data/FergusonEtAl2015.nwb'

  useEffect(async () => {
    let nwb = await import('../../../../../src')

    // Load NWB File
      const io = new nwb.IO(reader)
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

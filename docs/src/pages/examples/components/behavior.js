import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

export default function BehaviorExample() {

  // HTML Element References
  const load = useRef(null);
  const x = useRef(null);
  const y = useRef(null);
  const t = useRef(null);

  const __ = useRef(null);

  useEffect(async () => {

    let reader = await import('h5wasm')
    let nwb = await import('../../../../../src')
    if (nwb?.default) nwb = nwb.default
    let io = new nwb.NWBHDF5IO(true)

    // Load NWB File
    console.log('NWB', nwb)
    const file = new nwb.NWBFile()
    console.log('File', file, nwb)
    const mousePosition = new nwb.behavior.Position()
    const mouseClick = new nwb.behavior.BehavioralEvents()

    const startTime = Date.now()
    document.onmousemove = handleMouseMove;
    function handleMouseMove(event) {
        var eventDoc, doc, body;

        event = event || globalThis.event; // IE-ism
        // Use event.pageX / event.pageY here
        x.current.innerHTML =  event.pageX
        y.current.innerHTML =  event.pageY
        t.current.innerHTML =  `${(Date.now() - startTime)/1000}s`

    }

      load.current.innerHTML = 'File Loaded'


    // Replicate Neuromatch Examples Here
    // https://compneuro.neuromatch.io/tutorials/intro.html



  }, []);

  return (
    <header className={clsx('hero hero--primary')}>
      <div className="container">
        <h1 className="hero__title">Behavior Example</h1>
        <p ref={load}></p>
        <p><strong>X:</strong> <span ref={x}></span></p>
        <p><strong>Y:</strong> <span ref={y}></span></p>
        <p><strong>t:</strong> <span ref={t}></span></p>

      </div>
    </header>
  );
}

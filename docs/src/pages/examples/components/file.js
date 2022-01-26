import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import * as jsnwb from '../../../../../src';

export default function FileExample() {

  const load = useRef(null);
  const get = useRef(null);
  const output = useRef(null);
  const input = useRef(null);

  let io;
  const examplePath = '../../data/FergusonEtAl2015.nwb'

  useEffect(() => {

      // 1. Fetch and Save Remote NWB File
    load.current.onclick = () => {
      io = new jsnwb.NWBHDF5IO()
      io.fetch(examplePath).then(file => {
        console.log(file)
        output.current.innerHTML = 'Loaded'
      })
    }

    // 2. Allow User to Load their own NWB File
    input.current.onchange = async (ev) => {
      io = new jsnwb.NWBHDF5IO()
      const name = ev.target.files[0].name
      await io.upload(ev)
      let file = io.read(name)
      console.log('File', file)
      output.current.innerHTML = 'Loaded'
    }


    // 3. Allow User to Download an NWB File off the Browser
    get.current.onclick = () => {
      if (io) io.download()
    }
  })

  return (
    <header className={clsx('hero hero--primary')}>
      <div className="container">
        <h1 className="hero__title">Example</h1>
        <p className="subtitle"><strong>File:</strong> <span ref={output}>None</span></p>
        <div>
          <button ref={load} className="button button--secondary button--lg">Load Default</button>
          <input type={'file'} ref={input}></input>
          <button ref={get} className="button button--secondary button--lg">Download</button>
        </div>
      </div>
    </header>
  );
}
import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import * as reader from 'h5wasm'

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function FileExample() {

  const local = useRef(null);
  const normal = useRef(null);
  const huge = useRef(null);


  const get = useRef(null);
  const output = useRef(null);
  const input = useRef(null);
  const progressDiv = useRef(null);

  const examplePath = '../../data/FergusonEtAl2015.nwb'
  let twophoton = 'https://api.dandiarchive.org/api/assets/827b4c2f-4235-4350-b40f-02e120211dcd/download/'

  useEffect(async () => {

    let jsnwb = await import('../../../../../src')
    let io = new jsnwb.NWBHDF5IO(reader)

    let file = examplePath
    let name = 'test.nwb'
    function runFetch() {
      // io.element = terminal.current

      io.fetch(file, name, (ratio, length) => {

        progressDiv.current.innerHTML = `${formatBytes(ratio*length,2)} of ${formatBytes(length, 2)}`

      }).then((file) => {
        console.log('File', file)
        output.current.innerHTML = 'Loaded ' + name + '. Check the console for output.'
      })
    }

      // 1. Fetch and Save Remote NWB File
    local.current.onclick = () => {
      file = examplePath
      name = 'local.nwb'
      runFetch()
    }
    
    normal.current.onclick = () => {
      file = 'https://api.dandiarchive.org/api/assets/1d82605e-be09-4519-8ae1-6977b91a4526/download/'
      name = 'normal.nwb'
      runFetch()
    }


    huge.current.onclick = () => {
      file = 'https://api.dandiarchive.org/api/assets/3bd3a651-f6cc-47a8-adbe-b4d82dbbe4d8/download/'
      name = 'huge.nwb'
      runFetch()
    }

    // 2. Allow User to Load their own NWB File
    input.current.onchange = async (ev) => {
      io = new jsnwb.NWBHDF5IO(reader)
      // io.element = terminal.current
      name = ev.target.files[0].name
      await io.upload(ev)
      let file = io.read(name)
      console.log('File', file)
      output.current.innerHTML = 'Loaded ' + name + '. Check the console for output.'
    }


    // 3. Allow User to Download an NWB File off the Browser
    get.current.onclick = () => {
      if (io) io.download(name)
    }
  })

  return (
    <header className={clsx('hero hero--primary')}>
      <div className="container">
        <h1 className="hero__title">Example</h1>
        <p className="subtitle"><strong>Fetch Progress:</strong> <span ref={progressDiv}></span></p>
        <p className="subtitle"><strong>File:</strong> <span ref={output}>None</span></p>
        <div>
          <button ref={local} className="button button--secondary button">Local File</button>
          <button ref={normal} className="button button--secondary button">Normal File</button>
          <button ref={huge} className="button button--secondary button">Huge File</button>

          <input type={'file'} ref={input}></input>
          <button ref={get} className="button button--secondary button--sm">Download</button>
        </div>
        {/* <div className={styles.terminal}><span ref={terminal}></span></div> */}
      </div>
    </header>
  );
}
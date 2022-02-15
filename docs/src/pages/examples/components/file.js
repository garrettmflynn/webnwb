import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import * as reader from 'h5wasm'
import * as components from '../../../../static/libraries/components/dist/index.esm'

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
  const calciumButton = useRef(null);
  const calcium_jpgButton = useRef(null);
  const gallery = useRef(null);

  const normal = useRef(null);
  const huge = useRef(null);

  const plot = useRef(null);


  const get = useRef(null);
  const output = useRef(null);
  const input = useRef(null);
  const progressDiv = useRef(null);
  const loaderDiv = useRef(null);

  const intracellular = '../../data/intracellular.nwb'
  const calcium_jpg = '../../data/calcium.jpg.nwb'
  const calcium = '../../data/calcium.nwb'

  // let twophoton = 'https://api.dandiarchive.org/api/assets/827b4c2f-4235-4350-b40f-02e120211dcd/download/'

  useEffect(async () => {

    gallery.current.style = `
      display; flex;
      flex-wrap; wrap;
      align-items: center;
    `

    let loader = new components.Loader({color: '#7aff80', type: 'linear'})
    loaderDiv.current.insertAdjacentElement('beforeend', loader)

    await import('https://cdn.plot.ly/plotly-2.9.0.min.js') // Loaded Plotly
    await import('../../../../static/libraries/whammy/index.js') // Loaded Plotly

    let jsnwb = await import('../../../../../src')
    let io = new jsnwb.NWBHDF5IO(reader)

    let file = intracellular
    let name = 'intracellular.nwb'
    function runFetch() {
      // io.element = terminal.current

      io.fetch(file, name, (ratio, length) => {

        progressDiv.current.innerHTML = `${formatBytes(ratio*length,2)} of ${formatBytes(length, 2)}`
        loader.progress = ratio

      }).then(async (file) => {

        plot.current.innerHTML = ''

        console.log('File', file)
        progressDiv.current.innerHTML = 'Loaded ' + name + '. Check the console for output.'

        
        // file.acquisition
        let key = Object.keys(file.acquisition)[0]
        let stimKey = Object.keys(file.stimulus.presentation)[0]

        const lines = []


        // Show Images
        if (file.acquisition[key].external_file){

          let waiter = new components.Loader({showPercent: false})
          waiter.style.margin = `50px`;
          plot.current.insertAdjacentElement('beforeend', waiter)


          let encoder = new Whammy.Video(15); 

          function processForWhammy(src, outputFormat) {
            return new Promise(resolve => {
            // Create an Image object
            var img = new Image();
            // Add CORS approval to prevent a tainted canvas
            img.crossOrigin = 'Anonymous';
            img.onload = function() {
              // Create an html canvas element
              var canvas = document.createElement('CANVAS');
              // Create a 2d context
              var ctx = canvas.getContext('2d');
              var dataURL;
              // Resize the canavas to the original image dimensions
              canvas.height = this.naturalHeight;
              canvas.width = this.naturalWidth;
              // // Draw the image to a canvas
              ctx.drawImage(this, 0, 0);
              // // Convert the canvas to a data url
              // dataURL = canvas.toDataURL(outputFormat);
              // Return the data url via callback
              resolve(canvas);
              // Mark the canvas to be ready for garbage 
              // collection
              // canvas = null;
            };
            // Load the image
            img.src = src;
            // make sure the load event fires for cached images too
            if (img.complete || img.complete === undefined) {
              // Flush cache
              img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
              // Try again
              img.src = src;
            }
          })

          }

          const arr = await Promise.all(file.acquisition[key].external_file.value.map((src) => processForWhammy(src, 'image/webp')))


          arr.forEach(o => {
            o.style.width = '100px'
            o.style.height = 'auto'
            encoder.add(o)
            gallery.current.insertAdjacentElement('beforeend', o)
          })

          encoder.compile(false, function(output){

            var url = (window.webkitURL || window.URL).createObjectURL(output);
            var vid = document.createElement('video');
            vid.controls = true;
            vid.src = url;
            vid.onended = function() {
              URL.revokeObjectURL(url);
            }

            waiter.remove()
            waiter = undefined
  
            plot.current.insertAdjacentElement('afterbegin', vid)
          });
        }
        
        // Show TimeSeries
        else {

          console.log('Data', file.acquisition[key])
          const dataValue = file.acquisition[key].data?.value

          if (key) lines.push({
            name: 'Acquisition',
            x: file.acquisition[key]?.timestamps?.value ?? Array.from({length: dataValue.length}, (_,i) => i),
            y: dataValue
          })
        }


        // Show Stimulus
        if (stimKey) lines.push({
          name: 'Stimulus',
          x: file.stimulus.presentation[stimKey]?.timestamps?.value ?? Array.from({length: file.stimulus.presentation[stimKey].data.value.length}, (_,i) => i),
          y: file.stimulus.presentation[stimKey].data.value,
          yaxis: 'y2',
          opacity: 0.5,
        })

        console.log(lines)
        if (lines.length > 0) Plotly.newPlot( plot.current, lines, {
          title: key ?? stimKey,
          margin: { t: 0 },
          yaxis: {title: 'Acquisition'},
          yaxis2: {
            title: 'Stimulus',
            titlefont: {color: 'rgb(148, 103, 189)'},
            tickfont: {color: 'rgb(148, 103, 189)'},
            overlaying: 'y',
            side: 'right'
          }
        } );

      })
    }

      // 1. Fetch and Save Remote NWB File
    local.current.onclick = () => {
      file = intracellular
      name = 'intracellular.nwb'
      runFetch()
    }

    calciumButton.current.onclick = () => {
      file = calcium
      name = 'calcium.nwb'
      runFetch()
    }

    calcium_jpgButton.current.onclick = () => {
      file = calcium_jpg
      name = 'calcium.jpg.nwb'
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
        <h1>File Test</h1>
        <span ref={progressDiv}>...</span>
        <br/><br/>
        <div ref={loaderDiv}></div>
        <br/><br/>
        <div>
          <button ref={local} className="button button--secondary button">Local Intracellular File</button>
          <button ref={calciumButton} className="button button--secondary button">Local Calcium Imaging File</button>
          <button ref={calcium_jpgButton} className="button button--secondary button">Local Calcium Imaging File (Images)</button>
          <br/><br/>
          <button ref={normal} className="button button--secondary button">Normal File</button>
          <button ref={huge} className="button button--secondary button">Huge File</button>

          <input type={'file'} ref={input}></input>
          <button ref={get} className="button button--secondary button--sm">Download</button>
        </div>

        <br/><br/>
        <div ref={plot}></div>
        <div ref={gallery}></div>


        {/* <div className={styles.terminal}><span ref={terminal}></span></div> */}
      </div>
    </header>
  );
}
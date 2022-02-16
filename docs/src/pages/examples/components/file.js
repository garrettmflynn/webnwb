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


  const links = {
    'Intracellular Electrophysiology':
    {
      'Ferguson et al. 2015': [
        'https://raw.githubusercontent.com/OpenSourceBrain/NWBShowcase/master/FergusonEtAl2015/FergusonEtAl2015.nwb',
        'https://raw.githubusercontent.com/OpenSourceBrain/NWBShowcase/master/FergusonEtAl2015/FergusonEtAl2015_PYR2.nwb',
        'https://raw.githubusercontent.com/OpenSourceBrain/NWBShowcase/master/FergusonEtAl2015/FergusonEtAl2015_PYR3.nwb',
        'https://raw.githubusercontent.com/OpenSourceBrain/NWBShowcase/master/FergusonEtAl2015/FergusonEtAl2015_PYR4.nwb',
        'https://raw.githubusercontent.com/OpenSourceBrain/NWBShowcase/master/FergusonEtAl2015/FergusonEtAl2015_PYR5_rebound.nwb'
      ],
      'Lantyer et al. 2018': [
        'https://raw.githubusercontent.com/vrhaynes/NWBShowcase/master/Lantyer/LantyerEtAl2018_170502_AL_257_CC.nwb',
        'https://raw.githubusercontent.com/vrhaynes/NWBShowcase/master/Lantyer/LantyerEtAl2018_170315_AL_216_VC.nwb',
        'https://raw.githubusercontent.com/vrhaynes/NWBShowcase/master/Lantyer/LantyerEtAl2018_170328_AB_277_ST50_C.nwb',
        'https://raw.githubusercontent.com/vrhaynes/NWBShowcase/master/Lantyer/LantyerEtAl2018_170328_AL_238_VC.nwb',
        'https://raw.githubusercontent.com/vrhaynes/NWBShowcase/master/Lantyer/LantyerEtAl2018_171220_NC_156_ST100_C.nwb',
        'https://raw.githubusercontent.com/vrhaynes/NWBShowcase/master/Lantyer/LantyerEtAl2018_180817_ME_9_CC.nwb'
      ],
      'Lanore et al. 2019': [
        'https://raw.githubusercontent.com/OpenSourceBrain/NWBShowcase/master/IgorPro/141210c3.nwb'
      ],
    },
    'Calcium fluorescence imaging (time series)': {
      'Triplett et al. 2018': [
        'https://raw.githubusercontent.com/OpenSourceBrain/NWBShowcase/master/TriplettEtAl2018/TriplettEtAl2018.nwb'
      ],
      'Kato et al. 2015': [
        'https://raw.githubusercontent.com/OpenSourceBrain/NWBShowcase/master/KatoEtAl2015/KatoEtAl2018.WT_Stim.6.nwb'
      ]
    },
    'Calcium fluorescence imaging (image series)': {
      'Packer et al. 2015': [
        'https://raw.githubusercontent.com/OpenSourceBrain/CalciumImagingDriftingGrating/master/neurofinder.01.01.jpg.nwb'
      ]
    },
    'Functional Near Infrared Spectroscopy (fNIRS)': {
      'Erat Sleiter et al. 2021': [
        'https://api.dandiarchive.org/api/assets/37f5e3ce-e1b7-48a7-a47d-6745875eacaa/download/',
        'https://api.dandiarchive.org/api/assets/3af36329-5e0c-4c20-a283-87207b5569f1/download/',
        'https://api.dandiarchive.org/api/assets/24aac547-1947-4f3f-a6e7-354ad9f5122d/download/'
      ]
    }
  }

  let file, name, loader;

  const buttons = useRef(null);

  const gallery = useRef(null);

  const normal = useRef(null);
  const huge = useRef(null);

  const plot = useRef(null);


  const get = useRef(null);
  const output = useRef(null);
  const input = useRef(null);
  const progressDiv = useRef(null);
  const loaderDiv = useRef(null);

  // let twophoton = 'https://api.dandiarchive.org/api/assets/827b4c2f-4235-4350-b40f-02e120211dcd/download/'

  useEffect(async () => {

    gallery.current.style = `
      display; flex;
      flex-wrap; wrap;
      align-items: center;
    `

    loader = new components.Loader({ color: '#7aff80', type: 'linear', text: 'Select a file', showPercent: false, textBackground: 'black', textColor: 'white'})
    loader.style = 'position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000;'
    // loader.text = 'No file'
    // loader.textBackground = 'black'
    // loader.textColor = 'white'

    loaderDiv.current.insertAdjacentElement('beforeend', loader)

    await import('https://cdn.plot.ly/plotly-2.9.0.min.js') // Loaded Plotly

    let nwb = await import('../../../../../src')
    let io = new nwb.IO(reader, true)

    for (let type in links) {
      const section = document.createElement('div')
      const header = document.createElement('h3')
      header.innerHTML = type
      section.insertAdjacentElement('afterbegin', header)

      for (let paperName in links[type]) {
        const paper = document.createElement('div')
        const linkArr = links[type][paperName]

        if (linkArr.length > 1){
          const h4 = document.createElement('h4')
          h4.innerHTML = paperName
          paper.insertAdjacentElement('afterbegin', h4)
        }

        linkArr.forEach((src, i) => {
          const button = document.createElement('button')
          button.class = 'button button--secondary button'
          // const link = document.createElement('a')
          // link.insertAdjacentElement('beforeend', button)
          // link.src = src

          const displayName = `${(linkArr.length > 1) ? `${paperName.split(' ')[0]} ${i + 1}` : `${paperName}`}`
          button.innerHTML = displayName
          paper.insertAdjacentElement('beforeend', button)
          button.onclick = () => {
            loader.progress = 0
            file = src
            name = `${displayName.replaceAll(/\s+/g, '')}.nwb` // Must change name for new files to request
            console.log(name)
            runFetch()
          }
        })

        section.insertAdjacentElement('beforeend', paper)
      }
      buttons.current.insertAdjacentElement('beforeend', section)

    }

    async function parseFile(file){
      loader.progress = 1
      plot.current.innerHTML = ''
      gallery.current.innerHTML = ''

      console.log('File', file)
      // progressDiv.current.innerHTML = 'Loaded ' + name + '. Check the console for output.'


      // file.acquisition
      let key = Object.keys(file.acquisition)[0]
      let stimKey = Object.keys(file.stimulus.presentation)[0]

      const lines = []


      // Show Images
      if (file.acquisition[key].external_file) {

        let waiter = new components.Loader({ showPercent: false })
        waiter.style.margin = `50px`;
        plot.current.insertAdjacentElement('beforeend', waiter)

        function createImg(src) {
          return new Promise(resolve => {
            // Create an Image object
            var img = new Image();
            // Add CORS approval to prevent a tainted canvas
            img.crossOrigin = 'Anonymous';
            img.onload = function () {
              resolve(img);
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

        const arr = await Promise.all(file.acquisition[key].external_file.value.map((src) => createImg(src)))


        arr.forEach(o => {
          o.style.width = '100px'
          o.style.height = 'auto'
          gallery.current.insertAdjacentElement('beforeend', o)
        })

        waiter.remove()
        waiter = undefined
      }

      // Show TimeSeries
      else {

        const dataValue = file.acquisition[key].data?.value

        if (key) lines.push({
          name: 'Acquisition',
          x: file.acquisition[key]?.timestamps?.value ?? Array.from({ length: dataValue.length }, (_, i) => i),
          y: dataValue
        })
      }


      // Show Stimulus
      if (stimKey) lines.push({
        name: 'Stimulus',
        x: file.stimulus.presentation[stimKey]?.timestamps?.value ?? Array.from({ length: file.stimulus.presentation[stimKey].data.value.length }, (_, i) => i),
        y: file.stimulus.presentation[stimKey].data.value,
        yaxis: 'y2',
        opacity: 0.5,
      })

      if (lines.length > 0) Plotly.newPlot(plot.current, lines, {
        title: key ?? stimKey,
        margin: { t: 0 },
        yaxis: { title: 'Acquisition' },
        yaxis2: {
          title: 'Stimulus',
          titlefont: { color: 'rgb(148, 103, 189)' },
          tickfont: { color: 'rgb(148, 103, 189)' },
          overlaying: 'y',
          side: 'right'
        }
      });
  }

    function runFetch() {
      // io.element = terminal.current

      io.fetch(file, name, (ratio, length) => {

        loader.progress = ratio
        loader.text = `${formatBytes(ratio * length, 2)} of ${formatBytes(length, 2)} downloaded.`

      }).then(async (file) => {
        parseFile(file)
      })
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
      io = new nwb.IO(reader, true)
      // io.element = terminal.current
      name = ev.target.files[0].name
      await io.upload(ev)
      let file = io.read(name)
      console.log('File', file)
      parseFile(file)
      // output.current.innerHTML = 'Loaded ' + name + '. Check the console for output.'
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
        {/* <span ref={progressDiv}>...</span> */}
        {/* <br /><br /> */}
        <div ref={loaderDiv}></div>
        {/* <br /><br /> */}
        <div>
          <h2>NWB Showcase</h2>
          <div ref={buttons}></div>

          <br /><br />
          <h2>DANDI</h2>
          <button ref={normal}>Normal File</button>
          <button ref={huge}>Huge File</button>

          <br /><br />
          <h2>Local Actions</h2>
          <input type={'file'} ref={input}></input>
          <button ref={get}>Download</button>
        </div>

        <br /><br />
        <div ref={plot}></div>
        <div ref={gallery}></div>


        {/* <div className={styles.terminal}><span ref={terminal}></span></div> */}
      </div>
    </header>
  );
}
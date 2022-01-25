import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import * as nwb from '../../../../../src';

export default function BasicExample() {
  
    const get = useRef(null);
    const output = useRef(null);
  
    useEffect(() => {
      get.current.onclick = () => {
        nwb.get('../../data/FergusonEtAl2015.nwb').then(async res => {
          console.log(res)
        }).catch(err => {
          console.log(err)
          output.current.innerHTML = err.error
        })
      }
    });
  
    return (
      <header className={clsx('hero hero--primary')}>
        <div className="container">
          <h1 className="hero__title">Example</h1>
          <p className="subtitle"><strong>File:</strong> <span ref={output}></span></p>
          <div>
            <button ref={get} className="button button--secondary button--lg">Get</button>
          </div>
        </div>
      </header>
    );
  }
  
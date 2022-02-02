import React from 'react';
import clsx from 'clsx';
import styles from './examples.module.css';
import DemoExample from './components/basic';
import { useHistory } from 'react-router';
import FileExample from './components/file';
import NeuromatchExample from './components/neuromatch';

export default function ExampleSelector({server}) {
   const history = useHistory();
    var url = globalThis.location;
    var name = (globalThis?.URLSearchParams) ? new globalThis.URLSearchParams(url.search)?.get('name') : 'file'
    const [example, setExample] = React.useState(name ?? 'file');


    const renderExample = (name) => {
        switch(name) {
          case 'demo':
            return <DemoExample/>
          case 'file':
            return <FileExample/>
          case 'neuromatch':
            return <NeuromatchExample/>
        }
      }

    const set = (name) => {
      history.replace(`/examples?name=${name}`)
      setExample(name)
    }
  
    return (
        <>
      <nav className={clsx(styles.nav)}>
        {/* <button onClick={() => set('demo')}>
          Demo
        </button> */}
        <button onClick={() => set('file')}>
          File
        </button>
        <button onClick={() => set('neuromatch')}>
          Neuromatch
        </button>
        </nav>

        <header>
            {renderExample(example)}
        </header>
        </>
    );
  }
  
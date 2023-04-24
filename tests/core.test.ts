import './node/setBlob' // There's an issue with tinybuild where it expects to have a Blob class but doesn't provide it in Node.js
import { ready } from '../src/index';

import create, { save } from './create'
import { beforeAll, describe, expect, test } from 'vitest';

describe(`Can create an NWB file`, () => {

  let nwbFile: any;

  beforeAll(async () => {
      await ready
      nwbFile = create()
  })

  test('instantiated file is an object', () => {
    expect(nwbFile).toBeInstanceOf(Object)
  })

  test('saved file is an object', async () => {
    console.log('NWB File', nwbFile)
    const savedFile = await save(nwbFile, 'myTestFile.nwb')
    expect(savedFile).toBeInstanceOf(Object)
  })

})
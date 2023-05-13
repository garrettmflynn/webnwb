import { NWBHDF5IO, symbols } from '../src/index';

import create, { save } from './create'
import { beforeAll, describe, expect, test } from 'vitest';

const ibiSubjectTestURL = 'https://dandiarchive.s3.amazonaws.com/blobs/e0a/c01/e0ac011a-c995-4982-b1c7-f4fa0219ea9c?response-content-disposition=attachment%3B%20filename%3D%22sub-ZFM-02372_ses-88224abb-5746-431f-9c17-17d7ef806e6a_behavior%2Becephys%2Bimage.nwb%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAUBRWC5GAEKH3223E%2F20230505%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20230505T014956Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=4825a9a410a61cfce0c0d7692a6bb439bf46c00fd72580fef242cf689e18347e'


describe(`Can create an NWB file`, () => {

  let nwbFile: any;

  beforeAll(async () => {
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

// describe('test streaming', () => {
  
//   test('class inheritance behaves as expected', async () => {
//     const io = new NWBHDF5IO()
//     const file = await io.stream(ibiSubjectTestURL)
//     const general = await file.general
//     const subject = await general.subject
//     const api = file[symbols.api]
//     expect(subject).instanceOf(api.Subject)
//     expect(subject).not.instanceOf(api.NWBFile)
//   })
// })
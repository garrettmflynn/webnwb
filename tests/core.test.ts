import './node/setBlob' // There's an issue with tinybuild where it expects to have a Blob class but doesn't provide it in Node.js
import nwb, { ready } from '../src/index';

describe(`Can create an NWB file`, () => {

  let nwbFile: any;

  beforeAll(async () => {
      await ready
      nwbFile = new nwb.NWBFile({
        session_description: 'test',
        identifier: 'test',
        session_start_time: new Date(),
        experimenter: 'Garrett Flynn',
    })
  })

  test('instantiated file is an object', () => {
    expect(nwbFile).toBeInstanceOf(Object)
  })

})
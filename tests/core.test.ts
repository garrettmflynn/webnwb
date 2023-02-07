import nwb from '../src/index';

describe(`Can create an NWB file`, () => {

  const nwbFile = new nwb.NWBFile({
    session_description: 'test',
    identifier: 'test',
    session_start_time: new Date(),
    experimenter: 'Garrett Flynn',
  });

})
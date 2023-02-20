import nwb from '../src/index';

const readFile = async (...args: any[]) => {
    const io = new nwb.NWBHDF5IO()
    return await io.load(...args)
}

export default readFile
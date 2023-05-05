import NWBAPI, { apiSymbol } from './api'
import io from './io'

// import { newKeySymbol } from "../../../../esmodel/src/index";
import { newKeySymbol } from 'esconform'


// Ensure HDF5 Features are ready
import { ready } from 'hdf5-io';
// import { ready } from '../../hdf5-io/src/index';

// Generate API + Attach IO as a Module
const api = new NWBAPI()
api.NWBHDF5IO = io

// Export Default API
export default api

export const NWBHDF5IO = io // Export named IO reference


const symbols = {
    api: apiSymbol,
    new: newKeySymbol
}

export {

    // Promises
    ready,

    // Symbols
    symbols,

    // API
    api,
    io,

    // Classes
    NWBAPI
}

import NWBAPI from './api'
import io from './io'

// Ensure HDF5 Features are ready
import { ready } from 'hdf5-io';

// Generate API + Attach IO as a Module
const api = new NWBAPI()
api.NWBHDF5IO = io

// Export Default API
export default api


export {
    ready,
    api,
    io
}

import NWBAPI from './api'
import NWBHDF5IO from './io'

// Generate API + Attach IO as a Module
const api = new NWBAPI()
api.NWBHDF5IO = NWBHDF5IO
export default api
import { ArbitraryObject } from '../types/general.types'

// Types
import * as version240 from './2.4.0'

const schemas: ArbitraryObject = [ ]

const versions = [
    // [ Add newer versions here ]
    version240
    // [ Add older versions here ]
]

versions.forEach(o => {
    const nwbNamespace = o.namespaces.nwb.namespaces[0]
    const hdf5Namespace = o.namespaces.hdmf.namespaces[0]
    
    const schema = {
        [nwbNamespace.name]: {
            [nwbNamespace.version]: {
                namespace: JSON.stringify(o.namespaces.nwb),
                ...o.core
            }
        }, 
        [hdf5Namespace.name]: {
            [hdf5Namespace.version]: {
                namespace: JSON.stringify(o.namespaces.hdmf),
                ...o.hdmf
            }
        }
    }

    schemas.push(schema)
}) 

export default schemas

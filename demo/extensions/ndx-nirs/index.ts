import { NWBAPI } from '../../../src/index'

import ndxNirsNamespaces from './ndx-nirs.namespace.yaml'
const namespace = ndxNirsNamespaces.namespaces[0]
import ndxNirsExtension from './ndx-nirs.extensions.yaml'

const nirsAPI = new NWBAPI({
    [namespace.name]: {
        [namespace.version]: {
            namespace: ndxNirsNamespaces,
            [`${namespace.name}.extensions`]: ndxNirsExtension
        }
    }
})

console.log('API (extended)', nirsAPI)
console.log('NIRSSourcesTable extends DynamicTable', nirsAPI.NIRSSourcesTable.prototype instanceof nirsAPI.DynamicTable, nirsAPI.NIRSSourcesTable.prototype instanceof nirsAPI.NWBFile)

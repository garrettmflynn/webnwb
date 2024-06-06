import nwb from '../src/index'

// DANDI
import * as dandi from 'dandi'
// import * as dandi from 'htts://jsdelivr.net/npm/dandi@0.0.2/dist/index.esm'

const getFromDandi = async (id = '000003', asset_id = '29ba1aaf-9091-469a-b331-6b8ab818b5a6') => {
    const dandiset = await dandi.get(id) // Request a dandiset by ID

    if (dandiset) {
        // const gotDandiset = (await dandi.getAll()).find(o => o.identifier === id)// Get the first dandiset from the list of all dandisets
        const asset = await dandiset.getAsset(asset_id)
        const io = new nwb.NWBHDF5IO()
        return await io.fetch(asset.metadata.contentUrl[0], 'dandiTest.nwb', { useStreaming: true })
    }
    else return
}

export default getFromDandi
import * as dandi from '../src/index'

const STAGING_API_TOKEN = '7e55c22480388e1be10245e30fadb67e7e34ed0a'
const ACTIVE_API_TOKEN = '55346d570fcf3667cbf2578d2fa3902811a0fefa'

// // Create a new dandiset
// const apiStaging = new dandi.API({
//     token: STAGING_API_TOKEN,
//     type: 'staging'
// })

// await apiStaging.init()
// const res =  await apiStaging.create('This is my new dataset')
// console.log(res)


const dandisetId = '000552'
const api = new dandi.API({ token: ACTIVE_API_TOKEN })
await api.init()

const dandiset = await api.get(dandisetId)
if (dandiset) {
    const assets = await dandiset.getAssets()
    for (let key in assets) {
        const asset = assets[key]
        if (asset.path.includes('_obj')) {
            console.error(asset.path)
            const newPath = asset.path.split('_')
            newPath.splice(2,1)
            await asset.update({ path: newPath.join('_') })
        }

        if (!asset.path.includes('+ecephys')){
            console.warn(asset.path)
            const res = await asset.update({
                path: asset.path.replace('behavior', 'behavior+ecephys')
            })
            console.warn(res)
        }
    }
}

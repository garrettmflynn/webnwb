import { InstanceType, Options } from "./types"
import { getInfoURL, getJSON } from "./utils"

type AssetBase = {
    asset_id: string
    blob: string
    created: string
    modified: string
    path: string
    size: number
    zarr: string | null // NOTE: Not sure if this type is correct
  }
  
export class Asset {

    asset_id?: AssetBase['asset_id']
    blob?: AssetBase['blob']
    created?: AssetBase['created']
    modified?: AssetBase['modified']
    path?: AssetBase['path']
    size?: AssetBase['size']
    zarr?: AssetBase['zarr']

    #instance: InstanceType
    #dandiset: string
    #info: any = {}
    
    constructor(dandiset: string, info: string | AssetBase, instance: InstanceType = 'main') {
    if (info && typeof info === 'object' && !(info instanceof String)) this.#set(info)
    else this.asset_id = info as string
    this.#instance = instance
    this.#dandiset = dandiset
    }
  
    #set = (o: any) => {
        Object.assign(this, o)
        this.asset_id = o.asset_id  // Sync the provided ID with the object
    }
  
    async get (dandiset = this.#dandiset, id = this.asset_id, instance = this.#instance) {
      this.#dandiset = dandiset
      this.#instance = instance
      this.asset_id = id

      const asset = await getAsset(this.#dandiset, this.asset_id, this.#instance)
      if (asset) Object.assign(this, asset)
      return asset
    }
  
  
    async getInfo(options?: Options) {
      if (!this.#info) this.#info = await getAssetInfo(this.#dandiset, this.asset_id, {...options, instance: this.#instance})
      return this.#info
    }
  
  }



export const getAsset  = async (dandiset: string, id: string, options?: Options) => {
    const url = getInfoURL(dandiset, options)
    const base = await getJSON(`${url}/${id}`)
    return new Asset(dandiset, base, options?.instance)
  }
  
  
  export const getAssetInfo  = async (dandiset: string, id: string, options?: Options) => {
    const url = getInfoURL(dandiset, options)
    return await getJSON(`${url}/${id}/info`)
  }

  export default Asset
  
import request from "./request"
import { AssetRequestConfig, InstanceType, Options } from "./types"
import { getAssetUrl, getBase, getInfoURL, getJSON } from "./utils"

type AssetBase = {
    asset_id: string
    blob: string
    created: string
    modified: string
    path: string
    size: number
    zarr: string | null // NOTE: Not sure if this type is correct

    metadata: any
  }
  
export class Asset {

    asset_id: AssetBase['asset_id']
    blob?: AssetBase['blob']
    created?: AssetBase['created']
    modified?: AssetBase['modified']
    path?: AssetBase['path']
    size?: AssetBase['size']
    zarr?: AssetBase['zarr']
    metadata?: AssetBase['metadata'] // WE ASSUME THIS IS ALREADY HERE, THOUGH IT ISN'T WITH POINTERS

    #options: Options
    #dandiset: string
    
    constructor(dandiset: string, info: string | AssetBase, options: Options = {}) {

      const isObject = info && typeof info === 'object' && !(info instanceof String)
      if (isObject) this.#set(info)
      this.asset_id = isObject ? this.asset_id = info.asset_id : info as string

      this.#options = options
      this.#dandiset = dandiset
    }
  
    #set = (o: any) => {
        Object.assign(this, o)
        this.asset_id = o.asset_id  // Sync the provided ID with the object
    }

    #getRequestConfig = () => {
      return {
        id: this.asset_id,
        dandiset: this.#dandiset, 
        options: this.#options
      }
    }
  
    async get (dandiset = this.#dandiset, id = this.asset_id, options = this.#options) {
      this.#dandiset = dandiset
      this.#options = options
      this.asset_id = id

      const asset = await getAsset(this.#getRequestConfig())

      if (asset) Object.assign(this, asset)
      return asset
    }


    update = async (metadataUpdate = {}) => {

      const metadata = Object.assign(Object.assign({}, this.metadata), metadataUpdate)

      const config = this.#getRequestConfig()

      const additionalMetadata = this.zarr ? { zarr_id: this.zarr } : { blob_id: this.blob }
      
      const data = await request(
        getAssetUrl(config), 
        {
          options: this.#options,
          method: "PUT",
          body: JSON.stringify({ metadata, ...additionalMetadata  })
        }
      )

      Object.assign(this, data) // Update all metadata
      return data

    }
  
  }

export const getAsset  = async (config: AssetRequestConfig) => {
    const base = await request(`${getAssetUrl(config)}/info`, { options: config.options })
    return new Asset(config.dandiset, base, config.options)
  }

  export default Asset
  
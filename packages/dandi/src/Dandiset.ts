import { Asset, getAsset } from "./Asset"
import { InstanceType, Options } from "./types"
import { getBase, getInfo, getInfoURL, getInstance, getJSON, getLatestVersion, paginate } from "./utils"

type DandisetVersionInfo = {
    asset_count: number,
    created: string
    modified: string
    name: string
    size: number
    status: string
    version: string | 'draft'
  }
  type DandisetBase = {
    identifier: string
    contact_person: string
    created: string
    embargo_status: string
    modified: string
    draft_version: DandisetVersionInfo
    most_recent_published_version: DandisetVersionInfo
  }

  export class Dandiset {

    #instance: InstanceType = 'main'
  
  
    // All provided synchronously from the constructor
    identifier?: DandisetBase['identifier']
    contact_person?: DandisetBase['contact_person']
    created?: DandisetBase['created']
    embargo_status?: DandisetBase['embargo_status']
    modified?: DandisetBase['modified']
    draft_version?: DandisetBase['draft_version']
    most_recent_published_version?: DandisetBase['most_recent_published_version']
  
    // Hidden properties fetched asynchronously
    #base: any = {}
    #info: any = {}
    #assets: any = {}
    #gotAllAssets = false


    constructor(info: DandisetBase | DandisetBase['identifier'] | undefined, instance: InstanceType = 'main') {
        if (info && typeof info === 'object' && !(info instanceof String)) this.#set(info)
        else this.identifier = info as string
        this.#instance = instance
      }
  
      #set = (o: any) => {
        this.#base = o
        Object.assign(this, o)
        this.identifier = o.identifier  // Sync the provided ID with the object
      }
  
    async get (id = this.identifier) {

        if (id !== this.identifier) {
            this.identifier = id
            this.#info = {}
            this.#assets = {}

            const base = await getBase(this.identifier, this.#instance)
            if (base) Object.assign(this, base)
        }

        return this.#base

    }
  
    async getInfo(options: Options = {}) {
      if (Object.keys(this.#info).length === 0) this.#info = await getInfo(this.identifier, {...options, instance: this.#instance})
      return this.#info
    }
  
    async getAsset(id: string, options: Options = {}) {
        if (!this.#assets[id]) this.#assets[id] = await getAsset(this.identifier, id, {...options, instance: this.#instance})
        return this.#assets[id]
    }
  
    async getAssets(options: Options = {}) {
        if (!this.#gotAllAssets) {
        const assets = await getAssets(this.identifier, {...options, instance: this.#instance})
        console.log('Got assets', assets)

        assets?.forEach((o: any) => this.#assets[o.asset_id] = o)
        this.#gotAllAssets = true
      }
      return this.#assets
    }
  }



  export const getAssetsUrl = (dandiset: string, options?: Options) => {
    return `${getInfoURL(dandiset, options)}/assets`
  }

export const getAssets = async (id: string, options?: Options) => {
    const version = options?.version ?? await getLatestVersion(id, options?.instance)
    if (version) {
      const url = `${getAssetsUrl(id, {...options, version})}`
      const res = await getJSON(url)
      return (await paginate(res)).map(pointer => {
        console.log('Got asset pointer', pointer)
        return getAsset(id, pointer.asset_id, options)
      })
    }
  }
  
  
  
  export const getAll = async (instance?: Options['instance']) => {
    const url = `https://${getInstance(instance)}/api/dandisets`
    const res = await getJSON(url)
    const results = (await paginate(res)).map(o => new Dandiset(o, instance))
    return results
  }
  
  export const get = async (id: string, instance?: InstanceType) => {
    const info = await getBase(id, instance)
    if (info) return new Dandiset(info, instance)
    else return null
  }
  
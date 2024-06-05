import { Asset, getAsset } from "./Asset"
import request from "./request"
import { Options, AssetsRequestConfig, AssetRequestConfig } from "./types"
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
  
    // All provided synchronously from the constructor
    identifier: DandisetBase['identifier']
    contact_person?: DandisetBase['contact_person']
    created?: DandisetBase['created']
    embargo_status?: DandisetBase['embargo_status']
    modified?: DandisetBase['modified']
    draft_version?: DandisetBase['draft_version']
    most_recent_published_version?: DandisetBase['most_recent_published_version']
  
    // Hidden properties fetched asynchronously
    #base: any = {}
    #info: any = {}

    #assets: {
      [x:string]: Asset
    } = {}

    #gotAllAssets = false

    #options: Options = {}

    constructor(info: DandisetBase | DandisetBase['identifier'] | undefined, options: Options) {

        const isObject = info && typeof info === 'object' && !(info instanceof String)
        if (isObject) this.#set(info)

        this.identifier = isObject ? info.identifier : info as string // Sync the provided ID with the object
        
        this.#options = options
      }
  
      #set = (o: any) => {
        this.#base = o
        Object.assign(this, o)
        this.identifier = o.identifier  // Sync the provided ID with the object
      }
  
      // GET Fetch Calls
    async get (id = this.identifier) {

        if (id !== this.identifier) {
            this.identifier = id
            this.#info = {}
            this.#assets = {}

            const base = await getBase(this.identifier, this.#options)
            if (base) Object.assign(this, base)
        }

        return this.#base

    }
  
    async getInfo(options: Options = this.#options) {
      
      options = { ...this.#options, ...options }

      if (Object.keys(this.#info).length === 0) this.#info = await getInfo(this.identifier, options)
      return this.#info
    }
  
    async getAsset(id: string, options: Options = this.#options) {

        options = { ...this.#options, ...options }

        if (!this.#assets[id]) this.#assets[id] = await getAsset({
          dandiset: this.identifier, 
          id, 
          options
        })
        return this.#assets[id]
    }
  
    async getAssets(options: Options = this.#options) {
        if (!this.#gotAllAssets) {
        const assets = await getAssets({
          dandiset: this.identifier, 
          options
        })
        assets?.forEach((o: any) => this.#assets[o.asset_id] = o)
        this.#gotAllAssets = true
      }
      return this.#assets
    }
  }



  export const getAssetsUrl = (dandiset: string, options: Options = {}) => {
    return `${getInfoURL(dandiset, options)}/assets`
  }

export const getAssets = async (config: AssetsRequestConfig | string) => {
   const resolvedConfig = (typeof config === 'string') ? { dandiset: config } : config
   let options: AssetRequestConfig['options'];
   const dandiset = resolvedConfig.dandiset
   if ('options' in resolvedConfig) options = resolvedConfig.options
   else options = {}

   const version = options.version ?? await getLatestVersion(dandiset, options)
    if (version) {
      const url = `${getAssetsUrl(dandiset, {...options, version})}`
      const res = await getJSON(url, options)
      return await Promise.all((await paginate(res, options)).map(async pointer => getAsset({dandiset, options, id: pointer.asset_id })))
    }
  }
  

  export const getAll = async (options: Options = {}) => {
    const url = `https://${getInstance(options.type)}/api/dandisets`
    const res = await getJSON(url, options)
    const results = (await paginate(res, options)).map(o => new Dandiset(o, options))
    return results
  }

  export const get = async (id: string, options: Options = {}) => {
    const info = await getBase(id, options)
    if (info) return new Dandiset(info, options)
    else return null
  }
  
  export const getMine = async (
    options: Options = {},
    include: Record<string, any> = {}
  ) => {

    const { draft = true, empty = true, embargoed = false } = include

    const search = new URLSearchParams()
    search.append('user', 'me')
    search.append('draft', draft ? 'true' : 'false')
    search.append('empty', empty ? 'true' : 'false')
    search.append('embargoed', embargoed ? 'true' : 'false')

    const pathname = `dandisets?${search.toString()}`

    const res = await request(pathname, { options })
    
    const results = (await paginate(res, options)).map(o => new Dandiset(o, options))
    return results
  }
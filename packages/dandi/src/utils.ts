import instances from "./instances"
import request from "./request"
import { AssetRequestConfig, InstanceType, Options } from "./types"

export const getLatestVersion = async (id: string, options: Options) => {
    const base = await getBase(id, options)

    if (base){
        const recent = base.most_recent_published_version?.version
        if (recent) return recent

        const isValidDraft = base.draft_version?.status === 'Valid'
        if (isValidDraft) return base.draft_version?.version
    } else return null
}

export const getInstance = (instance?: InstanceType) => typeof instance === 'string' ? instances[instance] : instances.main

export const getURL = (path: string, instanceType?: InstanceType) => {
  if (path.startsWith('http')) new URL(path)
  return new URL(path, `https://${getInstance(instanceType)}/api/`)
}

export const getJSON = (pathname: string, options: Options) => request(pathname, { options })

export const getDandisetURL = (id: string) => `dandisets/${id}`
export const getAssetUrl = (config: AssetRequestConfig) => `dandisets/${config.dandiset}/versions/${config.options?.version || 'draft'}/assets/${config.id}`

// NOTE: Redo
export const getBase = (id: string, options: Options) => getJSON(getDandisetURL(id), options)

export const getInfoURL = (id: string, options: Options = {}) => `${getDandisetURL(id)}/versions/${options?.version ? options.version : 'draft'}`

export const getInfo = async (id: string, options: Options = {}) => {
  const version = options.version ?? await getLatestVersion(id, options)
  if (version) return getJSON(getInfoURL(id, {...options, version}), options)
}


export const paginate = async (o: any, options) : Promise<any[]> => {

    const results = []
  
    if (o.results) results.push(...o.results)
  
    if (o.next) {
      const info = await getJSON(o.next, options)
      results.push(...await paginate(info, options))
    }
    
    return results
  }
import instances from "./instances"
import { AssetRequestConfig, InstanceType, Options } from "./types"

export const getLatestVersion = async (id: string, instance?: InstanceType) => {
    const base = await getBase(id, instance)

    if (base){
        const recent = base.most_recent_published_version?.version
        if (recent) return recent

        const isValidDraft = base.draft_version?.status === 'Valid'
        if (isValidDraft) return base.draft_version?.version
    } else return null
}

export const getInstance = (instance?: InstanceType) => typeof instance === 'string' ? instances[instance] : instances.main

export const getURL = (path: string, instanceType?: InstanceType) => new URL(path, `https://${getInstance(instanceType)}/api/`)

export const getJSON = (url: string) => fetch(url).then(res => res.json())

export const getDandisetURL = (id: string) => `dandisets/${id}`
export const getAssetUrl = (config: AssetRequestConfig) => `dandisets/${config.dandiset}/versions/${config.options.version || 'draft'}/assets/${config.id}`

const getBaseURL = (id: string, instance?: InstanceType) => `https://${getInstance(instance)}/api/${getDandisetURL(id)}`

export const getBase = (id: string, instance?: InstanceType) => getJSON(getBaseURL(id, instance))

export const getInfoURL = (id: string, options: Options = {}) => `${getBaseURL(id, options.type)}/versions/${options?.version ? options.version : 'draft'}`

export const getInfo = async (id: string, options: Options = {}) => {
  const version = options.version ?? await getLatestVersion(id, options.type)
  if (version) return getJSON(getInfoURL(id, {...options, version}))
}


export const paginate = async (o: any) : Promise<any[]> => {

    const results = []
  
    if (o.results) results.push(...o.results)
  
    if (o.next) {
      const info = await getJSON(o.next)
      results.push(...await paginate(info))
    }
    
    return results
  }
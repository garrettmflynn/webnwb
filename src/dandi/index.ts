const instances = {
  main: `api.dandiarchive.org`,
  staging:  `api-staging.dandiarchive.org`
}

type InstanceType = 'main' | 'staging'

type Options = {
 instance?: InstanceType,
 version?: string
}

const getLatestVersion = async (id: string, instance?: InstanceType) => {
    const base = await getBase(id, instance)

    if (base){
        const recent = base.most_recent_published_version?.version
        if (recent) return recent

        const isValidDraft = base.draft_version?.status === 'Valid'
        if (isValidDraft) return base.draft_version?.version
    } else return null
}

const getInstance = (instance: InstanceType) => typeof instance === 'string' ? instances[instance] : instances.main

export const getJSON = (url: string) => fetch(url).then(res => res.json())

const getBaseURL = (id: string, instance?: InstanceType) => `https://${getInstance(instance)}/api/dandisets/${id}`

const getBase = (id: string, instance?: InstanceType) => getJSON(getBaseURL(id, instance))

export const getInfoURL = (id: string, options?: Options) => `${getBaseURL(id, options?.instance)}/versions/${options?.version ? options.version : 'draft'}`

export const getInfo = async (id: string, options?: Options) => {
  const version = options?.version ?? await getLatestVersion(id, options?.instance)
  if (version) return getJSON(getInfoURL(id, {...options, version}))
}

export const getAssets = async (id: string, options?: Options) => {
  const version = options?.version ?? await getLatestVersion(id, options?.instance)
  if (version) {
    const url = `${getInfoURL(id, {...options, version})}/assets`
    const res = await getJSON(url)
    return await paginate(res)
  }
}

export const getDandisets = async (instance?: Options['instance']) => {
  const url = `https://${getInstance(instance)}/api/dandisets`
  const res = await getJSON(url)
  return await paginate(res)
}

const paginate = async (o: any) : Promise<any[]> => {

  const results = []

  if (o.results) results.push(...o.results)

  if (o.next) {
    const info = await getJSON(o.next)
    results.push(...await paginate(info))
  }
  
  return results
}

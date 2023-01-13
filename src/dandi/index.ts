
const getLatestVersion = async (id: string) => {
    const base = await getBase(id)

    if (base){
        const recent = base.most_recent_published_version?.version
        if (recent) return recent

        const isValidDraft = base.draft_version?.status === 'Valid'
        if (isValidDraft) return base.draft_version?.version
    } else return null
}

export const getJSON = (url: string) => fetch(url).then(res => res.json())

const getBaseURL = (id: string) => `https://api.dandiarchive.org/api/dandisets/${id}`

const getBase = (id: string) => getJSON(getBaseURL(id))

export const getInfoURL = (id: string, version:string = 'draft') => `${getBaseURL(id)}/versions/${version}`

export const getInfo = async (id: string, version?:string) => {
  const latestVersion = version ?? await getLatestVersion(id)
  if (latestVersion) return getJSON(getInfoURL(id, latestVersion))
}

export const getAssets = async (id: string, version?: string) => {
  const latestVersion = version ?? await getLatestVersion(id)
  if (latestVersion) {
    const url = `${getInfoURL(id)}/assets`
    const res = await getJSON(url)
    return await paginate(res)
  }
}

export const getDandisets = async () => {
  const url = 'https://api.dandiarchive.org/api/dandisets'
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

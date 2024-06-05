import { Options } from "./types"
import { getURL } from "./utils"

type JSONMimeType = 'application/json'

type BaseHeaders = {
    accept: JSONMimeType,
    'Content-Type': JSONMimeType,
    Authorization?: string
}

export const getBaseHeaders = (token?: string) => {

    const headers = {
        'accept': 'application/json',
        'Content-Type': 'application/json'
    } as BaseHeaders

    if (token) headers.Authorization = `token ${token}`
   
    return headers
}

export type APIRequestConfig = {
    options: Options,
    json?: any
} & RequestInit

export const request = async (pathname: string, config: APIRequestConfig) => {
    const { options = {} } = config

    const url = getURL(pathname, options.type)

    const headers = { ...getBaseHeaders(options.token), ...config.headers ?? {} }

    // Other Request
    if (config.method && config.method !== 'GET') {

        const data = config.body || JSON.stringify(config.json ?? {})

        if (!options.token) throw new Error('No DANDI API token provided.')
            
        return await fetch(url, {
            method: config.method,
            headers,
            body: data,
        })
        .then(res => {
            if (res.ok) return res.json()
            throw new Error(`Request failed with status code ${res.status}`)
        })
        .catch(e => {
            if (e instanceof TypeError) console.error('[dandi]: Backend does not have CORS enabled for POST / PUT requests...')
            return null
        })
    }

    // Simple GET Request
    else {
        return await fetch(url, { headers }).then(response => response.json())
    }


}

export default request
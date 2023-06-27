import { InstanceType } from './types'
import { getURL } from './utils'

export * from './Dandiset'
export * from './Asset'
export * as utils from './utils'
// const assetInfo = await dandi.getJSON(`${url}/${o.asset_id}/info`)
// const option = document.createElement('option')
// option.value = assetInfo.metadata.contentUrl[0]


type VersionMetadata = any

type APIOptions = {
    token: string,
    type?: InstanceType
}

export class API {

    token: APIOptions['token']
    type: APIOptions['type']

    authorized: boolean = false

    constructor({ token, type = 'main' }: APIOptions) {

       this.token = token
       this.type = type 

    }

    init = async () => {
        await this.authorize()
    }

    #checkAuthorization = () => {
        if (!this.authorized) throw new Error('API is not authorized. Please provide a valid token.')
    }

    create = async (name: string, metadata: VersionMetadata = {}, embargo: boolean = false) => {
        
        this.#checkAuthorization()

        const url = getURL(`dandisets/?embargo=${embargo}`, this.type)
        const data = JSON.stringify({ name, metadata })

        const created = await fetch(url, {
            method: 'POST',
            headers: this.#getBaseHeaders(),
            body: data,
        })
        .then(response => response.json()) // NOTE: Getting a net::ERR_FAILED 200 (OK) because of a CORS issue (even when successful)
    
        return created
    }

    #getBaseHeaders = (token = this.token) => {
        return {
            "Authorization": `token ${token}`,
            'accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }
    
    authorize = async (token: string = this.token) => {

        await fetch(getURL('auth/token', this.type), { headers: this.#getBaseHeaders(token) })
        .catch(e => {
            this.authorized = false
            throw e
        })

        this.token = token
        this.authorized = true
    }


}
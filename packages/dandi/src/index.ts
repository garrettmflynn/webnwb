import { get } from './Dandiset'
import { getBaseHeaders, request } from './request'
import { InstanceType, Options } from './types'
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

    get = async (id: string, options: Options = {}) => get(id, {...options, ...this})



    create = async (name: string, metadata: VersionMetadata = {}, embargo: boolean = false) => {
        
        this.#checkAuthorization()

        return request(`dandisets/?embargo=${embargo}`, {
            options: this,
            method: 'POST',
            json: { name, metadata }
        })
    }
    
    authorize = async (token: string = this.token) => {

        await request('auth/token', { options: this })
        .catch(e => {
            this.authorized = false
            throw e
        })

        this.token = token
        this.authorized = true
    }


}
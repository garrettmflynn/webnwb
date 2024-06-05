import { Dandiset, get } from './Dandiset'
import { 
    // getBaseHeaders, 
    request 
} from './request'
import { InstanceType, Options } from './types'
// import { getURL } from './utils'
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


    #checkAuthorization = () => {
        if (!this.authorized) throw new Error('API is not authorized. Please provide a valid token.')
    }

    get = async (id: string, options: Options = {}) => get(id, {...options, ...this})



    create = async (name: string, metadata: VersionMetadata = {}, embargo: boolean = false) => {
        
        this.#checkAuthorization()

        const result = await request(`dandisets/?embargo=${embargo}`, {
            options: this,
            method: 'POST',
            json: { name, metadata }
        })

        if (result.detail) throw new Error(result.detail)

        return this.get(result.identifier)

    }
    
    authorize = async (token: string = this.token) => {

        const validated = await validateToken({
            token,
            type: this.type
        }).catch(e => {
            console.error(e)
            return false
        })

        this.token = token
        
        return this.authorized = validated
    }


}

export const validateToken = async (options: Options ) => request('auth/token', { options })
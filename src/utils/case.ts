import * as array from "./array"

export type CaseType = 'pascal' | 'camel' | 'snake' | 'other'

export const get = (str: string) => {
    const transformed = str.replace(/([A-Z])/g, (g) => `_${g}`).toLowerCase()
    if (str === transformed) {
        if (str.includes('_')) return 'snake'
        else return 'camel'
    }
    else if (transformed[0] === '_') return 'pascal'
    else return 'other'
}

export const set = (base:string, type?: CaseType) => {

    if (!base) return ''

    const setFirst = (str:string, method: 'toUpperCase' | 'toLowerCase' ='toUpperCase') => `${(str[0] ?? '')[method]()}${str.slice(1)}`
    switch(type){
      case 'pascal':
        return base.split('_').map(str => setFirst(str)).join('');

    case 'snake':
        let splitUpper = base.split(/(?=[A-Z])/) as any[]
        return splitUpper.map(str => str.toLowerCase()).join('_');

    default: 
        let split = base.split(/(?=[A-Z])/) as any[]
        split = split.map((str) => str.split('_'))
        split = split.flat()

        return split.map((str, i) => {
            if (i) return setFirst(str.toLowerCase())
            else return str.toLowerCase()
        }).join('')
    }
  }


  // Deep clone and convert all keys to a certain case
  export const setAll = (info: any, type?: CaseType) => {

        const newInfo = Object.assign({}, info)

        for (let key in newInfo) {

        const newKey = (info.type === 'group') ? key : set(key, type) // skip for children of groups

        newInfo[newKey] = newInfo[key]

        if (newKey != key) delete newInfo[key]

        if (newInfo[newKey] && typeof newInfo[newKey] === 'object' && !array.check(newInfo[newKey])) {
                const drilled = setAll(info[key], type) // drill original object
                newInfo[newKey] = drilled
            }
        }


        return newInfo
  }
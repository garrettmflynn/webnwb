// HDF5-IO
import { isGroup as isGroupType } from '../../../hdf5-io/src';
// import { isGroup as isGroupType } from 'hdf5-io';

import * as array from "./array"

export type CaseType = 'pascal' | 'camel' | 'snake' | 'other'

export const get = (str: string) => {
    const lowercased = str.toLowerCase()
    const hasUpperCase = lowercased !== str
    const transformed = str.replace(/([A-Z])/g, (g) => `_${g}`).toLowerCase()
    if (hasUpperCase) {
        if (transformed[0] === '_') return 'pascal'
    }

    else if (str === transformed) {
        if (str.includes('_')) return 'snake'
        else return 'unknown'
    }

    
    return 'camel'
}


type ConditionType = CaseType | Function
export const set = (
    base:string | number | symbol, 
    type?: CaseType, 
    condition?: ConditionType,
) => {

    if (base == undefined) return ''
    else if (typeof base !== 'string') return base


    const toTransform = (typeof condition === 'function') ? condition(base) : (condition) ? get(base) === condition : true
    if (!toTransform) return base


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


  // Convert all keys to a certain case
  export const setAll = (
    info: any, 
    type?: CaseType, 
    condition: CaseType | Function = () => !info.type[isGroupType], // skip for children of groups
    drill: boolean = false
) => {

        const newInfo = info

        for (let key in newInfo) {

            const newKey = set(key, type, condition)

        // Copy property descriptions
        const desc = Object.getOwnPropertyDescriptor(newInfo, key)
        if (desc) Object.defineProperty(newInfo, newKey, desc)

        if (newKey !== key)  delete newInfo[key] // Only delete if changed

        if (drill && newInfo[newKey] && typeof newInfo[newKey] === 'object' && !array.check(newInfo[newKey])) {
                const drilled = setAll(info[key], type, condition) // drill original object
                newInfo[newKey] = drilled
            }
        }


        return newInfo
  }
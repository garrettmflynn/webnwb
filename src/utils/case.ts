import * as array from "./array"

type CaseType = 'pascal' | 'camel'

export const set = (base:string, type?: CaseType) => {

    if (!base) return ''

    const setFirst = (str:string, method: 'toUpperCase' | 'toLowerCase' ='toUpperCase') => `${(str[0] ?? '')[method]()}${str.slice(1)}`
    switch(type){
      case 'pascal':
        return base.split('_').map(str => setFirst(str)).join('')

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
      const newKey = set(key, type)
      newInfo[newKey] = newInfo[key]
      if (newKey != key) delete newInfo[key]

      if (newInfo[newKey] && typeof newInfo[newKey] === 'object' && !array.check(newInfo[newKey])) {
        console.log(Array.isArray(newInfo[newKey]), newInfo[newKey])
        const drilled = setAll(newInfo[newKey])
        newInfo[newKey] = drilled
      }
    }

    return newInfo
  }
import drill from "../../utils/drill"
import * as caseUtils from '../../utils/case'
import { InfoType } from "../types"
import * as test from "../utils/test"
import * as rename from "../utils/rename"

export default class Classify {

    info: any // can be set later
    constructor(info:InfoType) {
        this.set(info)
    }


    set = (info: InfoType) => {
        if (info) this.info = info
    }

    getHelpers = (base?: string, valueToDrill?: any, path:string[]=[], aliases:string | string[] = []) => {

    let str = ``

    if (base) {
        let pascal = caseUtils.set(base, 'pascal')
        let camel = caseUtils.set(rename.base(base, this.info.allCaps)) // ensure special all-caps strings are fully lowercase
        const thisString = `this.${path.slice(1).join('.')}`

        if (aliases && !Array.isArray(aliases)) aliases = [aliases]
        const names = new Set(aliases)
        names.add(pascal)

        const randId = Math.floor(100000*Math.random())

        // Add helper on base. Add empty object at path
        return `

        const methods${randId} = ${JSON.stringify(Array.from(names))}
        methods${randId}.forEach(method => {
        if (!this._deleted) {
          Object.defineProperty(this, '_deleted', {
            value: [],
            enumerable: false,
            writable: false,
          })
        }

        if (!${thisString}) ${thisString} = {};

        const addName = 'add' + method
        const getName = 'get' + method
        const createName = 'create' + method

        if (!this._deleted.includes(method)){
          try {
            Object.defineProperties(this, {
              [addName]: {
                value: function add${pascal}(obj) {
                  this.${camel}[obj.name] = obj
                }, 
                enumerable: false,
                writable: false
              },
              [getName]: {
                value: function get${pascal}(name) {
                  return this.${camel}[name]
                }, 
                enumerable: false,
                writable: false
              },
              [createName]: {
                value: function create${pascal}(o) {
                  let cls;
                  methods${randId}.forEach(method => {
                    if (!cls) cls = globalThis.apify.${this.info.name}._get(method)
                  })
                  if (cls) {
                    const created = new cls(o)
                    return this.add${pascal}(created)
                  } else {
                    console.error('[${this.info.name}]: Could not find class for ${pascal}');
                    return null
                  }
                }, 
                enumerable: false,
                writable: false
              }
            });
          } catch (e) {
            const aliases = ${JSON.stringify(aliases)}
            console.warn('[${this.info.name}]: Trying to redeclare a helper function for ${pascal}', 'removing aliases: ' + aliases)
            aliases.forEach(alias => {
              delete this[alias]
              this._deleted.push(alias)
            })
          };
        }
        })

        `    
      }

    if (valueToDrill) {
      for (let key in valueToDrill) {
        let newVal = valueToDrill[key]

        if (newVal && typeof newVal === 'object') {

          const nestedGroup = newVal.inherits && newVal.inherits.value

          // Create helpers for nested groups (those which kept their non-enumerable values) and their children (except for deep classes)
          if (nestedGroup) {

            this.info.allCaps.forEach(str => key = key.replace(str, ''))

            // update / remove class key
            if (path.length === 1) {
              let newKey = caseUtils.set(key)
              if (newKey != key) {
                valueToDrill[newKey] = valueToDrill[key] // transfer
                delete valueToDrill[key] // delete

                // reassign
                key = newKey
                newVal = valueToDrill[key]
              }
            }

            if (!test.isClass(key)) str += this.getHelpers(key, newVal, [...path, key], newVal?.inherits?.value)
          }
        }
      }
    }

    return str

    }


    get = (name: string, info: any) => {
        if (typeof info === 'object') {

            // Get all helper functions
            let helperFunctions = this.getHelpers(undefined, info, [name])
    
            // Map keys to attributes
            const keys = Object.keys(info)
            const mapped = keys.map((k: string) => {
              let val = info[k]
              val = this.scrub(val) // will remove internal groups
              return `this.${k} = ${JSON.stringify(val)}` // setting base object
            })
    
    
            // declare a type on the object if specified
            const declareType = drill(info, {
              run: (o:any) => o && !!o.type, // check if has type,
              drill: (o:any) => o && typeof o === 'object' // check if object
            }, (o: any, path: string[], acc: string) => {
              const joined = path.join('.')
    
              if (o.type !== 'class'){
                acc += `Object.defineProperty(this${joined ? `.${joined}` : ''}, "type", {
                  value: "${o.type}",
                  enumerable: false,
                  writable: false
                });\n`
              }
    
              return acc
            }, '')
    
            let overrides = ``
            for (let key in this.info.overrides[name]) {
              if (keys.includes(key)) overrides += `this.${key} = ${JSON.stringify(this.info.overrides[name][key](this.info))}\n` // keep overrides in schema
              else console.warn(`[${this.info.name}]: ${key} (override) is out of schema for ${name}`)
            }
            
            const inputArg = `o`
    
            // force input to schema (but always allow name)
            const handleInputString = `
              const arr = Object.keys(${inputArg})
              console.log('arr', arr)
              arr.forEach(key => {
                const val = ${inputArg}[key]
                if (key === 'name') this[key] = val
                else if (key in this){
                  console.log(key, this[key])
                  if (this[key] && typeof this[key] === 'object' && this[key].type === 'group') {
    
                    const camelKey = key[0].toUpperCase() + key.slice(1);
    
                    for (let name in val){
                      const instance = val[name]
                      console.log(key, name, instance)
                      this['create' + camelKey](instance); // create class from raw object
                    }
                  } else this[key] = val // assign raw attribute
                } else console.warn('[${this.info.name}]: ' + key + ' (argument) is out of schema for ${name}')
              })
            `
    
            const fnString = `return function ${name}(${inputArg}={}){
              ${mapped.join('\n')}
              ${declareType}
              ${helperFunctions}
              ${handleInputString}
              ${overrides}
            }`
    
            const generatedClass = new Function(fnString)();
            return generatedClass
          } else return undefined
    }


    scrub = (o:any) => {

        if (o && typeof o === 'object') {
    
            const scrubbed = Object.assign({}, o)
            for (let key in scrubbed) {
            const val = scrubbed[key]
            if (val){
                if (val.type === 'class') delete scrubbed[key]
                else this.scrub(scrubbed[key])
            }
            }
    
    
            return scrubbed
        } else return o
    }


    // get all classes + apply to reference
    replace(schema: any) {

    for (let clsName in schema) {

        const cls  = this.get(clsName, schema[clsName])
        if (cls) schema[clsName] = cls

    }

    return schema
  }
}
import drill from "../../utils/drill"
import * as caseUtils from '../../utils/case'
import { InfoType } from "../types"
import * as test from "../utils/test"
import * as rename from "../utils/rename"
import ApifyBaseClass from "./base"
import InheritanceTree from "../InheritanceTree"


const createClass = (name:string, cls: any) => {
    return ({[name] : class extends cls {
        constructor(info:any){
            super(info)
        }
    }})[name];
}


export default class Classify {

    info: any // can be set later
    classes: any = {}
    flatClasses: any = {}

    attributeMap: {
        [x: string]: string[]
    } = {
        name: []
    }

    constructor(info?:InfoType) {
        if (info) this.set(info)
    }


    set = (info: InfoType) => {
        if (info) this.info = info
    }

    match = (input: any) => {

        const keys = Object.keys(input)

        let choices: string[] = []
        keys.forEach(k => {

            const selection = this.attributeMap[k]
            const isZero = choices.length === 0
            if (selection && (isZero || choices.length > 1)){

                if (isZero)  choices = selection
                else choices = choices.reduce((a:string[], name) => {
                    const res = selection.includes(name)
                    if (res) a.push(name)
                    return a
                }, [])
            }
        })

        return choices[0]

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
                    if (!cls) cls = globalThis.apify.${this.info.name}.getMatchingClass(o) // NOTE: This is a tightly-coupled dependency—but magically creates the right class (if properly constrainted)
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

            this.info.allCaps.forEach((str: string) => key = key.replace(str, ''))

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

    applyHelpers = (prototype: any, base?: string, valueToDrill?: any, path:string[]=[], aliases:string | string[] = []) => {
        
    let str = ``


    if (base && valueToDrill?.type === 'group') {
        let pascal = caseUtils.set(base, 'pascal')
        let camel = caseUtils.set(rename.base(base, this.info.allCaps)) // ensure special all-caps strings are fully lowercase

        if (aliases && !Array.isArray(aliases)) aliases = [aliases]
        const names = new Set(aliases)
        names.add(pascal)


        const _deleted: string[] = []

        const methods = Array.from(names)
        methods.forEach(method => {

        // let target = prototype
        // const key = path.pop() as string
        // path.slice(1).forEach(key => target = target[key])
        // if (!target[key]) target[key] = {}

        const addName = 'add' + method
        const getName = 'get' + method
        const createName = 'create' + method


        if (!_deleted.includes(method)){
          try {
            Object.defineProperties(prototype, {
              [addName]: {
                value: function add(obj:any) {
                  this[camel][obj.name] = obj
                }, 
                enumerable: false,
                writable: false
              },
              [getName]: {
                value: function get(name:string) {
                  return this[camel][name]
                }, 
                enumerable: false,
                writable: false
              },
              [createName]: {
                value: function create(o:any) {
                  const cls = (globalThis as any).apify[this.info.name].getMatchingClass(o) // NOTE: This is a tightly-coupled dependency—but magically creates the right class (if properly constrainted)
                  if (cls) {
                    const created = new cls(o)
                    return this.add[pascal](created)
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
            console.warn(`[${this.info.name}]: Trying to redeclare a helper function for ${pascal}`, 'removing aliases: ' + aliases);

            (aliases as string[]).forEach((alias:string) => {
              delete prototype[alias]
              _deleted.push(alias)
            })
          };
        }
        })
      }

    if (valueToDrill) {
      for (let key in valueToDrill) {
        let newVal = valueToDrill[key]

        if (newVal && typeof newVal === 'object') {

          const nestedGroup = newVal.inherits && newVal.inherits.value

          // Create helpers for nested groups (those which kept their non-enumerable values) and their children (except for deep classes)
          if (nestedGroup) {

            this.info.allCaps.forEach((str: string) => key = key.replace(str, ''))

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

            if (!test.isClass(key)) str += this.applyHelpers(prototype, key, newVal, [...path, key], newVal?.inherits?.value)
          }
        }
      }
    }

    return str
    }


    // TODO: Remove. This is major legacy code
    getFromString = (name: string, info: any) => {
        if (typeof info === 'object') {

            // Get all helper functions
            let helperFunctions = this.getHelpers(undefined, info, [name])
    
            // Map keys to attributes
            const keys = Object.keys(info)
            const mapped = keys.map((k: string) => {

            // Add to argMap
            if (!this.attributeMap[k])  this.attributeMap[k] = []
            this.attributeMap[k].push(name)
            this.attributeMap['name'].push(name) // all may have names

            // Map to declaration
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
              arr.forEach(key => {
                const val = ${inputArg}[key]
                if (key === 'name') this[key] = val
                else if (key in this){
                  if (this[key] && typeof this[key] === 'object' && this[key].type === 'group') {
    
                    const camelKey = key[0].toUpperCase() + key.slice(1);
    
                    for (let name in val){
                      const instance = val[name]
                      instance.name = name // automatically set name
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

    get = (name:string, info: any) => {
        const generatedClassV2 = createClass(name, ApifyBaseClass);
        generatedClassV2.prototype.name = name

        // Map keys to attributes
        const keys = Object.keys(info)
         keys.map((k: string) => {

        // Add to argMap
        if (!this.attributeMap[k])  this.attributeMap[k] = []
        this.attributeMap[k].push(name)
        this.attributeMap['name'].push(name) // all may have names

        // Map to declaration
            let val = this.info.overrides[name]?.[k] ?? info[k] // allow overrides
            val = this.scrub(val) // will remove internal groups
            generatedClassV2.prototype[k] = val
        })

        // TO REMOVE: declare a type on the object if specified
        drill(info, {
            run: (o:any) => o && !!o.type, // check if has type,
            drill: (o:any) => o && typeof o === 'object' // check if object
            }, (o: any, path: string[]) => {

            let target = generatedClassV2.prototype
            path.forEach(key => target = target[key])
    
            // TODO: Figure out why this removes nonsense from the class (targets are undefined)
            if (target) Object.defineProperty(target, "type", {
                value: o.type,
                enumerable: false,
                writable: false
            })
        })

        this.applyHelpers(generatedClassV2.prototype, undefined, info, [name])

        // const v2 = new generatedClassV2({})
        // console.log(name, v2, v2 instanceof generatedClassV2, v2.name, v2.acquisition)
        // if (v2.acquisition) v2.addAcquisition({
        //     name: 'test'
        // })
        return generatedClassV2
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


    inherit = (info: any, type?: string) => {
        console.log(info)
        info.inherit(this.flatClasses, type) // use the InheritanceTree class
    }

    // Load classes in self
    load(fullSpec: any, inheritance?: {
        tree: InheritanceTree,
        type: string
    }, clone=true) {

        this.classes = (clone) ? JSON.parse(JSON.stringify(fullSpec)) : fullSpec

        // Load All Classes
        for (let spec in this.classes) {
            for (let version in this.classes[spec]){
            const schema = this.classes[spec][version]
            for (let namespace in schema) {
                const namespaceRef = schema[namespace]
                for (let clsName in namespaceRef) {
                    // const cls  = this.getFromString(clsName, namespaceRef[clsName])
                    const cls  = this.getFromString(clsName, namespaceRef[clsName])
                    if (cls) {
                        namespaceRef[clsName] = cls
                        this.flatClasses[clsName] = cls
                    }
                }
            }
            }
        }

        // Inherit Classes
        if (inheritance) this.inherit(inheritance.tree, inheritance.type)

    return this.classes
  }
}
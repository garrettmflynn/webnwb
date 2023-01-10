import drill from "../../utils/drill"
import * as caseUtils from '../../utils/case'
import { InfoType, OptionsType } from "../types"
import * as test from "../utils/test"
import * as rename from "../utils/rename"
import ApifyBaseClass from "./base"
import InheritanceTree from "./InheritanceTree"
import { getPropertyName, setProperty } from "./utils"


const createClass = (name: string, cls: any, options: Partial<OptionsType>) => {
  return ({ [name]: class extends cls { 
    constructor(info: InfoType, classOptions: any) {
      const copy = Object.assign({}, options)      
      super(info, Object.assign(copy, classOptions))
    }
  } })[name];
}


export default class Classify {

  info: any // can be set later
  classes: any = {}
  flatClasses: any = {}
  baseClass?: ApifyBaseClass

  attributeMap: {
    [x: string]: string[]
  } = {
      name: []
    }

  constructor(info?: InfoType) {
    if (info) this.set(info);
  }


  set = (info: InfoType) => {
    if (info) this.info = info;
  }

  applyHelpers = (prototype: any, base?: string, valueToDrill?: any, path: string[] = [], aliases: string | string[] = []) => {

    let str = ``


    const pass = base // Must have a base
      && (valueToDrill?.type === 'group' || valueToDrill?.type === 'class'); // Must be a group to add to

    if (pass) {

      let pascal = caseUtils.set(base, 'pascal')

      let camel = caseUtils.set(rename.base(base, this.info.allCaps)) // ensure special all-caps strings are fully lowercase

      let aliasArray = ((aliases && !Array.isArray(aliases)) ? [aliases] : aliases) as string[]
      aliasArray = aliasArray.map(name => caseUtils.set(name, 'pascal')) // All methods are pascal case
      const pascalMethodNames = new Set(aliases)
      pascalMethodNames.add(pascal)


      const _deleted: string[] = []

      const methods = Array.from(pascalMethodNames)
      methods.forEach(method => {

        const options = this.info

        const updatedMethod = getPropertyName.call(prototype, method, options)

        const addName = `add${updatedMethod}`
        const getName = `get${updatedMethod}`
        const createName = `create${updatedMethod}`

        pascal = updatedMethod // Use updated property name


        const classifyInfoName = options.name

        if (!_deleted.includes(method)) {
          try {

            setProperty.call(prototype, addName, {
              value: function add(obj: any) {
                // const isMap = this[camel] instanceof Map
                // const name = obj.name ?? (isMap ? this[camel].size : Object.keys(this[camel]).length)
                // if (isMap) this[camel].set(name, obj)
                // else 
                const name = obj.name ?? Object.keys(this[camel]).length
                this[camel][name] = obj
                return obj
                // this[camel].set(obj.name, obj)
              },
            })

            setProperty.call(prototype, getName, {
              value: function get(name: string) {
                // if (this[camel] instanceof Map) return this[camel].get(name)
                // else 
                return this[camel][name]
                // return this[camel].get(name)
              },
            })

            setProperty.call(prototype, createName, {
              value: function create(o: any) {
                const cls = (globalThis as any).apify[classifyInfoName].get(pascal, o) // NOTE: This is a tightly-coupled dependency—but magically creates the right class (if properly constrainted)
                if (cls) {
                  const created = new cls(o, options)
                  return this[addName](created)
                } else {
                  console.error(`[${classifyInfoName}]: Could not find class for ${pascal}`);
                  return null
                }
              },
            })

          } catch (e) {
            console.warn(`[${options.name}]: Trying to redeclare a helper function for ${pascal}`, 'removing aliases: ' + aliases);

            (aliases as string[]).forEach((alias: string) => {
              delete prototype[alias]
              _deleted.push(alias)
            })
          };
        }
      })
    }

    if (valueToDrill) {
      for (let key in valueToDrill) {
        const newVal = valueToDrill[key]
        if (newVal && typeof newVal === 'object') {

          //   const nestedGroup = newVal.inherits && newVal.inherits.value

          //   // Create helpers for nested groups (those which kept their non-enumerable values) and their children (except for deep classes)
          //   if (nestedGroup) {

          // update / remove class key
          if (path.length === 1) {
            let newKey = caseUtils.set(key) // Updated key
            if (newKey != key) {
              valueToDrill[newKey] = newVal // transfer
              delete valueToDrill[key] // delete

              // reassign
              key = newKey
            }
          }


          if (!test.isClass(key)) {
            str += this.applyHelpers(prototype, key, newVal, [...path, key], newVal?.inherits?.value)
          }
          //   }
        }
      }
    }

    return str
  }

  get = (name: string, info: any) => {
    const generatedClassV2 = createClass(name, this.baseClass ?? ApifyBaseClass, this.info);
    generatedClassV2.prototype.name = name // always have the name specified

    // Map keys to attributes
    const keys = Object.keys(info)
    keys.map((k: string) => {

      const camel = caseUtils.set(rename.base(k, this.info.allCaps)) // ensure all keys (even classes) are camel case
      // Add to argMap
      if (!this.attributeMap[camel]) this.attributeMap[camel] = []
      this.attributeMap[camel].push(name)
      this.attributeMap['name'].push(name) // all may have names

      let finalKey = camel

      // Map to declaration
      let val = info[k]
      let override = this.info.overrides[name]?.[camel] ?? this.info.overrides[camel] // Global override

      if (override) {
        const typeOf = typeof override
        if (typeOf === 'function') val = () => override(info)
        else if (typeOf === 'string') {
          finalKey = override
          info[finalKey] = info[k]
          delete info[k]
        }
      }
      
      generatedClassV2.prototype[finalKey] = val
    })

    // TO REMOVE: declare a type on the object if specified
    drill(info, {
      run: (o: any) => o && !!o.type, // check if has type,
      drill: (o: any) => o && typeof o === 'object' // check if object
    }, (o: any, path: string[]) => {

      let target = generatedClassV2.prototype
      path.forEach(key => target = target[key])

      // proxy internal properties
      if (o.type === 'group' && path.length > 1) {
        const key =  path.slice(-1)[0]
        if (!(key in generatedClassV2.prototype)) {
          Object.defineProperty(generatedClassV2.prototype, key, {
            get: () => target,
            set: (val: any) => target = val,
            enumerable: true,
            configurable: false
          })
        } else console.error(`${name} already has key ${key}`)
      }

      // TODO: Figure out why this removes nonsense from the class (targets are undefined)
      if (target) Object.defineProperty(target, "type", {
        value: o.type,
        enumerable: false,
        writable: false
      })
    })


    this.applyHelpers(generatedClassV2.prototype, undefined, info, [name])

    return generatedClassV2
  }

  // Fuzzy match for class type
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


  inherit = (info: any, type?: string) => {
    info.inherit(this.flatClasses, type) // use the InheritanceTree class
  }

  // Load classes in self
  load(fullSpec: any, inheritance?: {
    tree: InheritanceTree,
    type: string
  }, clone = true) {

    this.classes = (clone) ? JSON.parse(JSON.stringify(fullSpec)) : fullSpec

    // Load All Classes
    for (let spec in this.classes) {
      for (let version in this.classes[spec]) {
        const schema = this.classes[spec][version]
        for (let namespace in schema) {
          const namespaceRef = schema[namespace]
          for (let clsName in namespaceRef) {
            const cls = this.get(clsName, namespaceRef[clsName])
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
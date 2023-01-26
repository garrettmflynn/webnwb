import drill from "../../utils/drill"
import * as caseUtils from '../../utils/case'
import { InfoType, OptionsType } from "../types"
import * as rename from "../utils/rename"
import ApifyBaseClass, { ClassOptionsType } from "./base"
import InheritanceTree from "./InheritanceTree"
import { getPropertyName, setProperty } from "./utils"
import { createQueueSymbol, hasNestedGroups, propertyReactionRegistrySymbol } from "../utils/globals"
import { isGroup as isGroupType } from '../../../../hdf5-io/src';
import { isNullSetter } from "./descriptions"


type InheritanceType = {
  tree: InheritanceTree,
  type: string
}

export default class Classify {

  info?: OptionsType // can be set later
  classes: any = {}
  flat: any = {
    classes: {},
    info: {}
  }

  inheritance?: InheritanceType

  baseClass?: ApifyBaseClass

  attributeMap: {
    [x: string]: Set<string>
  } = {}

  constructor(info?: InfoType) {
    if (info) this.set(info);
  }


  set = (info: InfoType) => {
    if (info) this.info = info;
  }

  createClass = (name: string, cls: any, specInfo: any) => {


    const context = this
    return ({
      [name]: class extends cls {
        constructor(info: InfoType, classOptions: any, specs: any | any[]) {

          // Performance Note: All of this is run every time this class is instantiated...
          const copy = Object.assign({}, context.info)
          if (!specs) specs = [specInfo]
          else specs.push(specInfo)

          super(info, Object.assign(copy, classOptions), specs)

        // Map keys to attributes
        if (specInfo) {
          const keys = Object.keys(specInfo)

          keys.map((k: string) => {
            let val = specInfo[k]
            const camel = caseUtils.set(rename.base(k, context.info.allCaps)) // ensure all keys (even classes) are camel case
            let finalKey = camel
  
            // Map to declaration
            let override = context.info.overrides[name]?.[camel] ?? context.info.overrides[camel] // Global override
  
            if (override) {
              const typeOf = typeof override
              if (typeOf === 'function') val = () => override(specInfo)
              else if (typeOf === 'string') {
                finalKey = override
                specInfo[finalKey] = specInfo[k]
                delete specInfo[k]
              }
            }
            
            const newKey = !(finalKey in this)

            // const isNull = typeof val === 'object' && !('constructor' in val)
            if (newKey) {
              this[finalKey] = val  // Set the key
            }
            
              const reactions = specInfo[propertyReactionRegistrySymbol]?.reactions
              
              const desc = Object.getOwnPropertyDescriptor(reactions, k)

              const pass = desc && desc.set && desc.get
              if (pass) {

                const setter = desc.set

                const existing = Object.getOwnPropertyDescriptor(this, finalKey)

                const alreadySet = desc.get?.toString() === existing?.get?.toString()
                const keepExisting = !!(existing && existing.get)

                // Handles streaming values
                if (!alreadySet) {

                  if (keepExisting) {
                    const copy = {...existing}

                    copy.get = function() {
                      const val = existing?.get?.call(this) // get existing value
                      return setter.call(this, val)
                    }

                    copy.set = desc.set  // Only overwrite existing setter
                    Object.defineProperty(this, finalKey, copy)
                  }

                  // Handles non-streaming values
                  else Object.defineProperty(this, finalKey, { ...desc, enumerable: true})


                  // Always run values through the setter
                  let value = (existing && existing.value) ? existing.value : val
                  this[finalKey] = value // Pass new value through the setter
                } 

              }
          })
  
  
          // proxy internal properties (if target found)
          drill(specInfo, {
            run: (o: any) => o && !!o.type, // check if has type,
            drill: (o: any) => o && typeof o === 'object' // check if object
          }, (o: any, path: string[]) => {
  
            let parent = this
            const pathCopy = [...path]
            const key = pathCopy.pop()
            pathCopy.forEach(key => parent = parent?.[key])
  
            if (key) {
              const target = parent?.[key]
              if (target && o[isGroupType] && path.length > 1) {
                if (!(key in this)) {
                  Object.defineProperty(this, key, {
                    get: () => parent[key],
                    set: (val: any) => parent[key] = val,
                    enumerable: true,
                    configurable: false
                  })
                } else console.error(`${name} already has key ${key}`)
              }
            }
          })
        } else console.error(`class ${name} does not have any info`);
  
        context.applyHelpers(this, undefined, specInfo, [name]) // Apply helpers using context  
        }
      }
    })[name];
  }

  applyHelpers = (instance: any, base?: string, valueToDrill?: any, path: string[] = [], aliases: string | string[] = []) => {


    const pass = base && valueToDrill[isGroupType] && !valueToDrill[hasNestedGroups] // Has a base and is a group (without internal groups)

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

        const updatedMethod = getPropertyName.call(instance, method, this.info)

        const addName = `add${updatedMethod}`
        const getName = `get${updatedMethod}`
        const createName = `create${updatedMethod}`

        pascal = updatedMethod // Use updated property name


        const classifyInfoName = this.info.name

        if (!_deleted.includes(method)) {
          try {

            setProperty.call(instance, addName, {
              value: function add(obj: any) {
                const name = obj.name ?? Object.keys(this[camel]).length
                Object.defineProperty(this[camel], name, {value: obj, enumerable: true})
                return obj
              },
            })

            setProperty.call(instance, getName, {
              value: function get(name: string) {
                return this[camel][name]
              },
            })

            setProperty.call(instance, createName, {
              value: function create(o: any, classOptions: ClassOptionsType = this.info) {
                const cls = (globalThis as any).apify[classifyInfoName].get(pascal, o) // NOTE: This is a tightly-coupled dependency—but magically creates the right class (if properly constrained)
                if (cls) {
                  const created = new cls(o, classOptions)
                  return this[addName](created)
                } else {
                  console.error(`[${classifyInfoName}]: Could not find class for ${pascal}`, o);
                  return null
                }
              },
            })

            // Create from the queue when the function is available
            if (instance[createQueueSymbol][createName]) {
              instance[createQueueSymbol][createName].forEach((f: Function) => f())
              delete instance[createQueueSymbol][createName]
            }

          } catch (e) {

            console.warn(`[${this.info.name}]: Trying to redeclare a helper function for ${pascal}`, 'removing aliases: ' + aliases);

            (aliases as string[]).forEach((alias: string) => {
              delete instance[alias]
              _deleted.push(alias)
            })
          };
        }
      })
    }

    // Apply helpers to nested groups
    if (valueToDrill?.[hasNestedGroups]) {
      for (let key in valueToDrill) {
        const newVal = valueToDrill[key]

        // Group object
        if (newVal && newVal[isGroupType]) {

          const newPath = [...path, key]

          //   const nestedGroup = newVal.inherits && newVal.inherits.value

          //   // Create helpers for nested groups (those which kept their non-enumerable values) and their children (except for deep classes)
          //   if (nestedGroup) {

          // update / remove class key
          if (path.length === 1) {
            let newKey = caseUtils.set(key) // Updated key
            if (newKey != key) {
              valueToDrill[newKey] = newVal // transfer
              delete valueToDrill[key] // delete
              key = newKey // reassign
            }
          }

          
            this.applyHelpers(instance, key, newVal, newPath, newVal?.inherits?.value)
        }
      }
    }

    return path
  }

  get = (name: string, info: any = this.flat.info[name], inheritance = this.inheritance) => {

    // Create class if required
    if (!this.flat.classes[name]) {
      let cls = this.baseClass ?? ApifyBaseClass

      // Ensure you inherit from the correct class
      if (inheritance) {
        const group = inheritance.type
        const info = inheritance.tree.tree[group][name]
        const inheritName = info.inherits
        if (inheritName) cls = this.get(inheritName, undefined, inheritance)
      }

      const generatedClassV2 = this.createClass(name, cls, info);


      const attrMap = this.attributeMap
  
      // Map keys to attributes
      Object.keys(info).map((k: string) => {
        const camel = caseUtils.set(rename.base(k, this.info.allCaps)) // ensure all keys (even classes) are camel case
        if (!attrMap[camel]) attrMap[camel] = new Set()
        attrMap[camel].add(name)
      })

      // generatedClassV2.prototype.name = name // always have the name specified
      this.flat.classes[name] = generatedClassV2 // Add to flat classes
    }

    return this.flat.classes[name]
  }

  // Fuzzy match for class type
  // TODO: Ensure that this handles inheritance well
  match = (input: any) => {

    const keys = Object.keys(input)

    let choices: string[] = []
    keys.forEach(k => {

      const selection = this.attributeMap[k]
      const isZero = choices.length === 0
      if (selection && (isZero || choices.length > 1)) {

        if (isZero) choices = Array.from(selection)
        else choices = choices.reduce((a: string[], name) => {
          const res = selection.has(name)
          if (res) a.push(name)
          return a
        }, [])
      }
    })

    return choices[0]

  }

  // Load classes in self
  load(fullSpec: any, inheritance?: InheritanceType, clone = true) {

    if (inheritance) this.inheritance = inheritance

    this.classes = (clone) ? JSON.parse(JSON.stringify(fullSpec)) : fullSpec

    // Load All Classes
    for (let spec in this.classes) {
      for (let version in this.classes[spec]) {
        const schema = this.classes[spec][version]
        for (let namespace in schema) {
          const namespaceRef = schema[namespace]
          for (let clsName in namespaceRef) {
            if (this.flat.info[clsName]) console.error(`Duplicate class ${clsName} found`)
            this.flat.info[clsName] = namespaceRef[clsName]
            Object.defineProperty(namespaceRef, clsName, {
              get: () => this.flat.classes[clsName],
              enumerable: true,
            })
          }
        }
      }
    }


    // Populate all classes now thay ou can reference their information globally
    for (let key in this.flat.info) this.get(key)


    return this.classes
  }
}
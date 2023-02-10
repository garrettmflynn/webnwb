import * as caseUtils from '../../../src/utils/case'
import { InfoType, OptionsType } from "../types"
// import * as rename from "../utils/rename"
import ApifyBaseClass, { ClassOptionsType } from "./base"
import InheritanceTree from "./InheritanceTree"
import { getPropertyName } from "./utils"
import { childrenTypes, hasNestedGroups } from "../utils/globals"

// HDF5-IO
// import { isGroup as isGroupType } from '../../../../hdf5-io/src';
import { isGroup as isGroupType } from 'hdf5-io';
import { ArbitraryObject } from 'src/types/general.types'

// ESConform
// import * as conform from '../../../../esmodel/src/index'
import * as conform from 'esconform'
const newKeySymbol = conform.newKeySymbol

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

        // ---------------- Performance Note ----------------
        // All of this is run every time ANY class is instantiated...
        constructor(info: InfoType, classOptions: any, specs: any | any[]) {

          // Gather the specification information
          const copy = Object.assign({}, context.info)
          if (!specs) specs = [specInfo]
          else specs.push(specInfo)

          super(info, Object.assign(copy, classOptions), specs)

          context.applyHelpers(this, undefined, specInfo, [name], specInfo[childrenTypes] ?? undefined)   // Apply helpers to the entire class object
        }
      }
    })[name];
  }

  applyHelpers = (instance: any, base?: string, valueToDrill?: any, path: string[] = [], typeAliases: Set<string> = valueToDrill?.[childrenTypes] ?? new Set()) => {


    const pass = valueToDrill[isGroupType] && !valueToDrill[hasNestedGroups] // Has a base and is a group (without internal groups)

    const info = this.info as OptionsType

    if (pass) {

      const names = Array.from(typeAliases)
      if (base) names.push(caseUtils.set(base, 'pascal') as string)

      const options = this.info
      const methods = new Set(names.map(k => getPropertyName.call(instance, k, options))) // Apply any transformations

      methods.forEach((method) => {

        const addName = `add${method}`
        const getName = `get${method}`
        const createName = `create${method}`

        // if (!_deleted.includes(method)) {
          try {

            
            Object.defineProperty(instance, addName,{
              value: function add(...args: [any] | [string, any]) {
                const obj = args.length === 1 ? args[0] : args[1]
                const name = (args.length === 1 ? (obj.name ?? options?.propertyName.reduce((acc:any, str:string) => acc = (!acc) ? obj[str] : acc, null)) : args[0]) // Get name by several means // NOTE: Name is a restricted property and always the default
                if (name) {
                  const target = base ? instance[base] : instance
                  if (target[newKeySymbol]) return target[newKeySymbol](name, obj)
                }

                console.error(`[${info.name}]: Could not add object:`, args);

              },
              configurable: true // In case we decide we don't need these because of duplicates...
            })

            Object.defineProperty(instance, getName, {
              value: function get(name: string) {
                const target = base ? instance[base] : instance
                return target[name]
              },
              configurable: true
            })

            const context = this
            Object.defineProperty(instance, createName, {
              value: function create( ...args: [ArbitraryObject] | [string, ArbitraryObject] | [ArbitraryObject, ClassOptionsType] | [string, ArbitraryObject, ClassOptionsType]) {


                const nameFirst = typeof args[0] === 'string'
                const oIndex = nameFirst ? 1 : 0
                const o = args[oIndex] as ArbitraryObject
                const options = (args[oIndex + 1] ?? context.info) as ClassOptionsType

                const name = nameFirst ? args[0] : (o.name ?? (options.propertyName ?? []).reduce((acc:any, str:string) => acc = (!acc) ? o[str] : acc, null)) // Get name by several means // NOTE: Name is a restricted property and always the default
                if (name) {
                  const clsKey = options.classKey as string

                  if (!o[clsKey]) {
                    if (typeAliases.size === 1) o[clsKey] = Array.from(typeAliases)[0]
                    else o[clsKey] = context.match(o, Array.from(typeAliases)) // Constrain choices
                  }

                  instance[addName](name, o)
                  // if (this[newKeySymbol]) this[newKeySymbol]()
                  // else console.error('Cannot create a new object...', this, o)

                  // const cls = (globalThis as any).apify[classifyInfoName].get(pascal, o) // NOTE: This is a tightly-coupled dependency—but magically creates the right class (if properly constrained)
                  // if (cls) {
                  //   const created = new cls(o, classOptions)
                  //   return this[addName](created)
                  // } else {
                  //   console.error(`[${classifyInfoName}]: Could not find class for ${pascal}`, o);
                  //   return null
                  // }
                } else {
                  console.error(`[${info.name}]: Could not find name for inputs:`, args);
                  return null
                }
              },
              configurable: true
            })

            // // Create from the queue when the function is available
            // if (instance[createQueueSymbol][createName]) {
            //   instance[createQueueSymbol][createName].forEach((f: Function) => f())
            //   delete instance[createQueueSymbol][createName]
            // }

          } catch (e) {
            console.warn(`[${info.name}]: Trying to redeclare a helper function for ${method}. Removing helpers for:`, method, instance);
            delete instance[addName]
            delete instance[getName]
            delete instance[createName]
          };
        // }
      })
    }

    // Apply helpers to nested groups
    if (valueToDrill?.[hasNestedGroups]) {
      for (let key in valueToDrill) {
        const newVal = valueToDrill[key]
        if (newVal && newVal[isGroupType]) {
          this.applyHelpers(instance, key, newVal, [...path, key], newVal[childrenTypes]) // Group object
        }
      }
    }

    return path
  }

  get = (name: string, info: any = this.flat.info[name], inheritance = this.inheritance) => {

    const options = this.info as OptionsType
    
    // Create class if required
    if (!this.flat.classes[name]) {
      let cls = this.baseClass ?? ApifyBaseClass

      // Ensure you inherit from the correct class
      if (inheritance) {
        const group = inheritance.type
        const info = inheritance.tree.tree[group][name]
        if (info) {
          if (info.inherits) cls = this.get(info.inherits, undefined, inheritance)
        } else console.error(`[${options.name}]: Could not find inheritance information for ${name}`)
      }

      const generatedClassV2 = this.createClass(name, cls, info);


      const attrMap = this.attributeMap

      // Map keys to attributes
      Object.keys(info).map((k: string) => {
        const targetCase = k 
        if (!attrMap[targetCase]) attrMap[targetCase] = new Set()
        attrMap[targetCase].add(name)
      })

      // generatedClassV2.prototype.name = name // always have the name specified
      this.flat.classes[name] = generatedClassV2 // Add to flat classes
    }

    return this.flat.classes[name]
  }

  // Fuzzy match for class type
  match = (input: any, choices: string[] = []) => {

    const keys = Object.keys(input)

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
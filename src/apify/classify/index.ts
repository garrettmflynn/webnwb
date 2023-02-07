import * as caseUtils from '../../utils/case'
import { InfoType, OptionsType } from "../types"
import * as rename from "../utils/rename"
import ApifyBaseClass, { ClassOptionsType } from "./base"
import InheritanceTree from "./InheritanceTree"
import { getPropertyName, setProperty } from "./utils"
import { hasNestedGroups } from "../utils/globals"
// import { isGroup as isGroupType } from '../../../../hdf5-io/src';
import { isGroup as isGroupType } from 'hdf5-io/dist/index.esm';

// import { newKeySymbol } from '../../../../esmodel/src'
import * as conform from 'esconform/dist/index.esm'
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

        // // Map the specification to the class
        // if (specInfo) {
        //   const keys = Object.keys(specInfo)

        //   keys.map((k: string) => {
        //     let specVal = specInfo[k]

        //     const camel = caseUtils.set(rename.base(k, context.info.allCaps)) // force camel case
        //     let finalKey = camel
  
        //     // Allow users to override the specification key / value
        //     let override = context.info.overrides[name]?.[camel] ?? context.info.overrides[camel] // global override
  
        //     if (override) {
        //       const typeOf = typeof override
        //       if (typeOf === 'function') specVal = () => override(specInfo)
        //       else if (typeOf === 'string') {
        //         finalKey = override
        //         specInfo[finalKey] = specInfo[k]
        //         delete specInfo[k]
        //       }
        //     }
            
        //     const newKey = !(finalKey in this)
        //     if (newKey) this[finalKey] = specVal  // If a new key, add the specification value
        //     // reactToProperties.call(this, finalKey, specInfo, specVal)
        //   })
  
  
        //   // Apply the entire specification
        //   drill(specInfo, (
        //     o: any, 
        //     path: string[], 
        //     // specParent: any
        //   ) => {
  
        //     let parent = this
        //     const pathCopy = [...path]
        //     const key = pathCopy.pop()
        //     pathCopy.forEach(key => parent = parent?.[key])
        //     const target = key ? parent?.[key] : undefined

        //     if (key && target) {

        //       // // react to internal group property changes
        //       // reactToProperties.call(parent, key, specParent)

        //       // proxy internal groups
        //       if (o[isGroupType] && path.length > 1) {
        //         if (!(key in this)) {
        //           Object.defineProperty(this, key, {
        //             get: () => parent[key],
        //             set: (val: any) => parent[key] = val,
        //             enumerable: false, // Do not enumerate these proxies
        //             configurable: false
        //           })
        //         } else console.error(`${name} already has key ${key}`)
        //       }
        //     }
        //   })
        // } else console.error(`class ${name} does not have any info`);
  
        // Apply helpers to the entire class object
        context.applyHelpers(this, undefined, specInfo, [name]) 
        }
      }
    })[name];
  }

  applyHelpers = (instance: any, base?: string, valueToDrill?: any, path: string[] = [], aliases: string | string[] = []) => {


    const pass = base && valueToDrill[isGroupType] && !valueToDrill[hasNestedGroups] // Has a base and is a group (without internal groups)

    const info = this.info as OptionsType

    if (pass && typeof base === 'string') {

      let pascal = caseUtils.set(base, 'pascal') as string

      let camel = caseUtils.set(rename.base(base, info.allCaps)) // ensure special all-caps strings are fully lowercase

      let aliasArray = ((aliases && !Array.isArray(aliases)) ? [aliases] : aliases) as string[]
      aliasArray = aliasArray.map(name => caseUtils.set(name, 'pascal') as string) // All methods are pascal case
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

        if (!_deleted.includes(method)) {
          try {

            setProperty.call(instance, addName, {
              value: function add(obj: any) {
                const name = obj.name ?? Object.keys(this[camel]).length
                if (this[camel][newKeySymbol]) return this[camel][newKeySymbol](name, obj)
                else console.error('Cannot add a new object...', this, obj)
              },
            })

            setProperty.call(instance, getName, {
              value: function get(name: string) {
                return this[camel][name]
              },
            })

            const context = this
            setProperty.call(instance, createName, {
              value: function create(o: any, classOptions: ClassOptionsType = context.info as ClassOptionsType) {


                const clsKey = classOptions.classKey as string

                if (!o[clsKey]) {
                  // const copy = {...o}
                  // delete copy.name
                  o[clsKey] = context.match(o)
                }

                console.warn('Trying to create a new object', o.name, o, o[clsKey])

                instance[addName](o)
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
              },
            })

            // // Create from the queue when the function is available
            // if (instance[createQueueSymbol][createName]) {
            //   instance[createQueueSymbol][createName].forEach((f: Function) => f())
            //   delete instance[createQueueSymbol][createName]
            // }

          } catch (e) {

            console.warn(`[${info.name}]: Trying to redeclare a helper function for ${pascal}`, 'removing aliases: ' + aliases);

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
            let newKey = caseUtils.set(key) as string // Updated key
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
        const camel = caseUtils.set(rename.base(k, options.allCaps)) as string // ensure all keys (even classes) are camel case
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
import drill from "../../utils/drill"
import * as caseUtils from '../../utils/case'
import { InfoType } from "../types"
import * as test from "../utils/test"
import * as rename from "../utils/rename"
import ApifyBaseClass from "./base"
import InheritanceTree from "./InheritanceTree"


const createClass = (name:string, cls: any) => {
    return ({[name] : class extends cls {}})[name];
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

    constructor(info?:InfoType) {
        if (info) this.set(info);
    }


    set = (info: InfoType) => {
        console.log('Info', info)
        if (info) this.info = info;
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

    applyHelpers = (prototype: any, base?: string, valueToDrill?: any, path:string[]=[], aliases:string | string[] = []) => {
        
    let str = ``

    if (
        base // Must have a base
        && valueToDrill?.type === 'group' // Must be a group to add to
        ) {

        let pascal = caseUtils.set(base, 'pascal')
        let camel = caseUtils.set(rename.base(base, this.info.allCaps)) // ensure special all-caps strings are fully lowercase

        if (aliases && !Array.isArray(aliases)) aliases = [aliases]
        const names = new Set(aliases)
        names.add(pascal)


        const _deleted: string[] = []

        const methods = Array.from(names)
        methods.forEach(method => {

        const addName = 'add' + method
        const getName = 'get' + method
        const createName = 'create' + method


        const classifyInfoName = this.info.name
        if (!_deleted.includes(method)){
          try {

            Object.defineProperties(prototype, {
              [addName]: {
                value: function add(obj:any) {
                  this[camel].set(obj.name, obj)
                }, 
              },
              [getName]: {
                value: function get(name:string) {
                  return this[camel].get(name)
                }, 
              },
              [createName]: {
                value: function create(o:any) {
                  const cls = (globalThis as any).apify[classifyInfoName].getMatchingClass(o) // NOTE: This is a tightly-coupled dependency—but magically creates the right class (if properly constrainted)
                  if (cls) {
                    const created = new cls(o)
                    return this[`add${pascal}`](created)
                  } else {
                    console.error(`[${classifyInfoName}]: Could not find class for ${pascal}`);
                    return null
                  }
                }, 
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

        //   const nestedGroup = newVal.inherits && newVal.inherits.value

        //   // Create helpers for nested groups (those which kept their non-enumerable values) and their children (except for deep classes)
        //   if (nestedGroup) {

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
        //   }
        }
      }
    }

    return str
    }

    get = (name:string, info: any) => {
        const generatedClassV2 = createClass(name, this.baseClass ?? ApifyBaseClass);
        // generatedClassV2.prototype.name = name // always have the name specified

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
                    const cls  = this.get(clsName, namespaceRef[clsName])
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
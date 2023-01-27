import { setAll } from "src/utils/case";
import { isPromise } from "src/utils/promise";
import { OptionsType } from "../types";
import { createQueueSymbol, hasNestedGroups } from "../utils/globals";
import { getPropertyName } from "./utils";
import { getAllPropertyNames, isGroup as isGroupType, onPropertyResolved as onPropertyResolvedType } from '../../../../hdf5-io/src';
// import drill from "src/utils/drill";

export type ClassOptionsType = {
    // Use to skip autorejection and otherwise generate values
    onRejectKey?: (key: string | symbol, value:any, info:any) => any, // return to include the value
    transformToSnakeCase?: boolean,
} & Partial<OptionsType>

function onValidKey (key:string|symbol, value: any, options: ClassOptionsType, specs: any[], instance: any) {

    // reinstantiate objects as classes
    let groupKey = isGroup(key, options, specs, instance)

    // assign raw value
    const group = this[key] = value[key]

    // individually resolve group keys
    if (groupKey) {
        for (let name in group) onPropertyResolved.call(instance, name, group[name], groupKey, options)
    } 

}

function getMethodName (name: string, options: ClassOptionsType) {
    const pascalKey = name[0].toUpperCase() + name.slice(1);
    return getPropertyName.call(this, pascalKey, options)
}

// function isGroupDirect(specs) {
//     return specs.find(spec => spec?.[isGroupType] && !spec?.[hasNestedGroups]) // Is a group without nested groups
// }

function isGroup(name: string | symbol, options: ClassOptionsType, specs: any[], instance: any) {
    if (typeof name === 'symbol') return false
    const found = specs.find(spec => spec[name]?.[isGroupType] && !spec[name]?.[hasNestedGroups]) // Is a group without nested groups
    if (found) return getMethodName.call(instance, name, options)
    else return false
}

// NOTE: 'this' is the base class with helper functions
function onPropertyResolved (name: string, instance: any, groupKey: string, options: ClassOptionsType) {
    if (isPromise(instance)) return instance.then((v: any) => onPropertyResolved.call(this, name, v, groupKey, options))
    else {
        instance.name = name // automatically set name

        console.log('Resolving property', groupKey)
        const createKey = `create${groupKey}`
        const create = () => this[createKey](instance, options)
        if (this[createKey]) return create(); // create class from raw object
        else {
            const queue = this[createQueueSymbol]
            if (queue[createKey]) queue[createKey].push(create)
            else queue[createKey] = [create]
        }
    }
}

function processLayer (info: any, options: ClassOptionsType, specs: any[], instance: any = this) {
        // Register the specification
        let validKeys = new Set()
        specs.forEach((spec: any) => {
            for (let key in spec) validKeys.add(key)
        })

        // Load information from the user (based on keys expected in the spec)
        const keys = [...getAllPropertyNames(info), ...Object.getOwnPropertySymbols(info)]

        keys.forEach((key: string | symbol) => {

            const isValid = validKeys.has(key)
            const desc = Object.getOwnPropertyDescriptor(info, key)
            const hasGetter = desc && desc.get

            if (hasGetter) {

                Object.defineProperty(this, key, { 
                    
                    get: () => {
                    
                        const value = info[key]
                        if (isPromise(value)) return value.then((v: any) => {
                            if ( typeof v === 'object') {
                                let group = isGroup(key, options, specs, instance)

                                // Create custom handler for when group properties are resolved...
                                if (group) {
                                    const groupKey = group as string
                                    Object.defineProperty(v, onPropertyResolvedType, {
                                        value: async (name:string, value: any) => {
                                            if (options.classKey) await value[options.classKey] // Just access the class key so it's available synchronously
                                            return onPropertyResolved.call(instance, name, value, groupKey, options)
                                        },
                                        configurable: true,
                                    })
                                }

                                Object.defineProperty(this, key, {value: v, enumerable: isValid})
                            }
                            return v
                        })

                        return value

                }, 
                enumerable: isValid, // Hide if not in schema
                configurable: true  // Allow overwriting later with the actual value
            })
            } else if (isValid) onValidKey.call(this, key, info, options, specs, instance)
            else {
                const value = info[key]
                Object.defineProperty(this, key, { value }) // Set property as non-enumerable write-only property
                if (options.onRejectKey) options.onRejectKey(key, value, info) // Handle rejection
            }

        })
}


class ApifyBaseClass {

    [createQueueSymbol]: any;

    [x: string|symbol]: any; // arbitrary

    constructor(info: any = {}, options: ClassOptionsType = {}, specs: any[] = []) {

        Object.defineProperty(this, createQueueSymbol, {value: {}}) // ensure this property is non-enumerable

        if (options.transformToSnakeCase) info = setAll(info, 'camel', 'snake') // Convert all keys to snake case

        processLayer.call(this, info, options, specs)

        // // Apply the entire specification
        // drill(info, (
        //     o: any, 
        //     path: string[], 
        //     parent: any
        //   ) => {
  
        //     const pathCopy = [...path]
        //     let target = this
        //     pathCopy.forEach(key => {
        //         target = target?.[key]
        //         specs = specs.map(spec => spec?.[key])
        //     })
            
        //     if (
        //         target 
        //         && !isGroupDirect(specs) // Excludes top layer
        //     ) {
        //         processLayer.call(target, o, options, specs, this)
        //         return false
        //     }

        //   })
    }
}

export default ApifyBaseClass
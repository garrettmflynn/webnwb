import { setAll } from "src/utils/case";
import { isPromise } from "src/utils/promise";
import { OptionsType } from "../types";
import { createQueueSymbol } from "../utils/globals";
import { getPropertyName } from "./utils";
import { getAllPropertyNames, isGroup as isGroupType, onPropertyResolved } from '../../../../hdf5-io/src';

export type ClassOptionsType = {
    // Use to skip autorejection and otherwise generate values
    onRejectKey?: (key: string, value:any, info:any) => any, // return to include the value
    transformToSnakeCase?: boolean,
} & Partial<OptionsType>


class ApifyBaseClass {

    #specs: any[];
    [createQueueSymbol]: any;

    [x: string|symbol]: any; // arbitrary

    constructor(info: any = {}, options: ClassOptionsType = {}, specs: any[] = []) {

        Object.defineProperty(this, createQueueSymbol, {value: {}}) // ensure this property is non-enumerable

        if (options.transformToSnakeCase) info = setAll(info, 'camel', 'snake') // Convert all keys to snake case

        this.#specs = specs

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
                                let isGroup = this.#isGroup(key, options)

                                // Create custom handler for when group properties are resolved...
                                if (isGroup) {
                                    const groupKey = isGroup as string
                                    Object.defineProperty(v, onPropertyResolved, {
                                        value: async (name:string, value: any) => {
                                            if (options.classKey) await value[options.classKey] // Just access the class key so it's available synchronously
                                            return this.#onPropertyResolved(name, value, groupKey, options)
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
            } else if (isValid) this.#onValidKey(key, info, options)
            else {
                const value = info[key]
                Object.defineProperty(this, key, { value }) // Set property as non-enumerable write-only property
                if (options.onRejectKey) options.onRejectKey(key, value, info) // Handle rejection
            }

        })
    }

    #onValidKey = (key:string|symbol, value: any, options: ClassOptionsType) => {

        // Reinstantiate objects as classes
        let groupKey = this.#isGroup(key, options)

        const group = value[key]

        if (groupKey) {
            for (let name in group) this.#onPropertyResolved(name, group[name], groupKey, options)
        } else this[key] = group // assign raw value

    }

    #getKey = (name: string, options: ClassOptionsType) => {
            const pascalKey = name[0].toUpperCase() + name.slice(1);
            return getPropertyName.call(this, pascalKey, options)
    }

    #isGroup = (name: string | symbol, options: ClassOptionsType) => {
        if (typeof name === 'symbol') return false
        const found = this.#specs.find(spec => spec[name]?.[isGroupType])
        if (found) return this.#getKey(name, options)
        else return false
    }

    #onPropertyResolved = (name: string, instance: any, groupKey: string, options: ClassOptionsType) => {
        if (isPromise(instance)) return instance.then((v: any) => this.#onPropertyResolved(name, v, groupKey, options))
        else {
            instance.name = name // automatically set name

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
}

export default ApifyBaseClass
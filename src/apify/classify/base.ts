import { setAll } from "src/utils/case";
import { OptionsType } from "../types";
import { deep } from "../utils/escode/clone";
import { getPropertyName } from "./utils";

export type ClassOptionsType = {
    // Use to skip autorejection and otherwise generate values
    onRejectKey?: (key: string, value:any, info:any) => any, // return to include the value
    transformToSnakeCase?: boolean,
} & Partial<OptionsType>

const isPromise = (o: any) => typeof o === 'object' && typeof o.then === 'function'


class ApifyBaseClass {

    [x: string]: any; // arbitrary

    constructor(info: any = {}, options: ClassOptionsType = {}) {

        if (options.transformToSnakeCase) info = setAll(info, 'camel', 'snake') // Convert all keys to snake case

        // Apply Inheritance to this Instance (from the schema)
        let target = this
        const prototypes = []
        do {
            target = Object.getPrototypeOf(target)
            const copy = deep(target, { nonenumerable: false }) // Make sure prototypes remain independent across instances
            prototypes.push(copy)
        } while (Object.getPrototypeOf(target))

        // Properly Inherit from All Superclasses
        prototypes.reverse().forEach(p => Object.assign(this, p))

        // Load Information from the User
        const arr = Object.keys(info)

        arr.forEach((key: string) => {

            const desc = Object.getOwnPropertyDescriptor(info, key)
            const hasGetter = desc && desc.get

            // NOTE: Streamed data still has camelCase keys here...
            if (hasGetter) {

                Object.defineProperty(this, key, { get: () => {
                    
                    const value = info[key]
                    if (isPromise(value)) return value.then((v: any) => {
                        if ( typeof v === 'object') {
                            let isGroup = this.#isGroup(key, options)
                             if (isGroup) {
                                const groupKey = isGroup as string
                                Object.defineProperty(v, '__onPropertyResolved', {
                                    value: async (name:string, value: any) => {
                                        if (options.classKey) await value[options.classKey] // Just access the class key so it's available synchronously
                                        this.#onPropertyResolved(name, value, groupKey, options)
                                    },
                                    configurable: true,
                                })
                             }

                             Object.defineProperty(this, key, {value: v, enumerable: key in this})
                        }
                        return v
                    })

                    return value

                }, enumerable: key in this })
            } else if (key in this) this.#onValidKey(key, info, options)
            else {
                const value = info[key]
                Object.defineProperty(this, key, { value }) // Set property as non-enumerable write-only property
                if (options.onRejectKey) options.onRejectKey(key, value, info) // Handle rejection
            }

        })
    }

    #onValidKey = (key:string, value: any, options: ClassOptionsType) => {

        // if (this[key] && typeof this[key] === 'object' && this[key].type === 'group') {
        if (this[key] && typeof this[key] === 'object'){

            // Reinstantiate objects as classes
            let groupKey = this.#isGroup(key, options)

            const group = value[key]

            if (groupKey) {
                for (let name in group) this.#onPropertyResolved(name, group[name], groupKey, options)
            } else this[key] = group

        } else this[key] = value[key] // assign raw attribute
    }

    #getKey = (name: string, options: ClassOptionsType) => {
        const pascalKey = name[0].toUpperCase() + name.slice(1);
        return getPropertyName.call(this, pascalKey, options)
    }

    #isGroup = (name: string, options: ClassOptionsType) => {
        let groupKey = this.#getKey(name, options)

        return (this[`create${groupKey}`]) ? groupKey : false
    }

    #onPropertyResolved = (name: string, instance: any, groupKey: string, options: ClassOptionsType) => {
        if (isPromise(instance)) return instance.then((v: any) => this.#onPropertyResolved(name, v, groupKey, options))
        else {
            instance.name = name // automatically set name
            return this[`create${groupKey}`](instance, options); // create class from raw object
        }
    }
}

export default ApifyBaseClass
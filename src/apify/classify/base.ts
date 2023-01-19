import { setAll } from "src/utils/case";
import { OptionsType } from "../types";
import { deep } from "../utils/escode/clone";
import { getPropertyName } from "./utils";

export type ClassOptionsType = {
    // Use to skip autorejection and otherwise generate values
    onRejectKey?: (key: string, value:any, info:any) => any, // return to include the value
    transformToSnakeCase?: boolean,
} & Partial<OptionsType>

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
            const val = info[key]
            if (key in this) {
            
                // if (this[key] && typeof this[key] === 'object' && this[key].type === 'group') {
                if (this[key] && typeof this[key] === 'object'){

                    const pascalKey = key[0].toUpperCase() + key.slice(1);
                    let finalKey = getPropertyName.call(this, pascalKey, options)

                    // Reinstantiate objects as classes
                    if (this[`create${finalKey}`]) {
                        for (let name in val) {
                            const instance = val[name]
                            instance.name = name // automatically set name
                            this[`create${finalKey}`](instance, options); // create class from raw object
                        }
                    } else this[key] = val // just set

                } else this[key] = val // assign raw attribute

            } else {
                Object.defineProperty(this, key, { value: val }) // Set property as write-only
                if (options.onRejectKey) options.onRejectKey(key, val, info) // Handle rejection
            }
        })
    }
}

export default ApifyBaseClass
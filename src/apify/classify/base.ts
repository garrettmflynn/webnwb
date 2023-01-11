import { OptionsType } from "../types";
import { deep } from "../utils/escode/clone";
import { getPropertyName } from "./utils";

export type ClassOptionsType = {
    // Use to skip autorejection and otherwise generate values
    onRejectKey?: (key: string, value:any, info:any) => any // return to include the value
} & Partial<OptionsType>

class ApifyBaseClass {

    [x: string]: any; // arbitrary

    constructor(info: any = {}, options: ClassOptionsType = {}) {


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
            if (key === 'name') this[key] = val
            else {

                if (!(key in this)) {
                    const res = (options.onRejectKey) ? options.onRejectKey(key, val, info) : undefined
                    if (res === undefined) {
                        console.warn(`[classify]: ${key} (argument) is out of schema for ${this.name}`, info, this);
                        return;
                    }
                }

                // if (this[key] && typeof this[key] === 'object' && this[key].type === 'group') {
                if (this[key] && typeof this[key] === 'object'){

                    const pascalKey = key[0].toUpperCase() + key.slice(1);
                    let finalKey = getPropertyName.call(this, pascalKey, options)

                    // Reinstantiate objects as classes
                    if (this[`create${finalKey}`]) {
                        for (let name in val) {
                            const instance = val[name]
                            instance.name = name // automatically set name
                            this[`create${finalKey}`](instance); // create class from raw object
                        }
                    } else this[key] = val // just set

                } else this[key] = val // assign raw attribute
            }
        })
    }
}

export default ApifyBaseClass
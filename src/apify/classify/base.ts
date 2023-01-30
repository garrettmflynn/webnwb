import * as caseUtils from "src/utils/case";
import { OptionsType } from "../types";
import { hasNestedGroups, isClassType } from "../utils/globals";
import { isGroup as isGroupType } from '../../../../hdf5-io/src';
import { Model, transfer } from "../../../../esmodel/src/index";

export type ClassOptionsType = {
    // Use to skip autorejection and otherwise generate values
    onRejectKey?: (key: string | symbol, value:any, info:any) => any, // return to include the value
    transformToSnakeCase?: boolean,
} & Partial<OptionsType>

class ApifyBaseClass {

    // [createQueueSymbol]: any;

    [x: string|symbol]: any; // arbitrary

    constructor(info: any = {}, options: ClassOptionsType = {}, specs: any[] = []) {


        // Object.defineProperty(this, createQueueSymbol, {value: {}}) // ensure queue property is non-enumerable

        const getValue = (typeof options.getValue === 'function') ? options.getValue : ((_, v) => v) as OptionsType['getValue']

        const clsKey = options.classKey as string
        // const camelClassKey = caseUtils.set(clsKey, 'camel')
        const specClassKey = options.specClassKey

        const model = new Model({
            
            keys: (key, specObj) => {

                const isPropertyOfGroup = specObj[isGroupType] && !specObj[hasNestedGroups]
                const camel = caseUtils.set(key, 'camel', 'snake') // Convert to camel case

                const toReturn = { 
                    value: camel, 
                    // silence: false  // silence nothing...
                 } as any

                // Allow for the enumerability of groups with arbitrary names...
                if (isPropertyOfGroup) {
                    const desc = Object.getOwnPropertyDescriptor(specObj, key) as PropertyDescriptor
                    toReturn.enumerable = desc?.enumerable ?? true // Properly enumerate properties on top-level groups
                    toReturn.silence = false // Do not silence arbitrary properties
                }


                return toReturn
            },

            // NOTE: Internal keys are not transformed here...
            values: (key, value, spec) => {
                

                // ensure groups are resolved as objects
                if (spec?.[isGroupType] && value === undefined) value = {}

                // Recognize class keys to allow for automatic class transformations
                let cls; 
                const clsKeys = [
                    clsKey,  // User-specified class key
                    specClassKey // Spec-specified class key
                ]
                const foundClsKey = clsKeys.find(key => key && value && typeof value === 'object' && key in value)
                if (foundClsKey) {
                    const clsName = caseUtils.set(value[foundClsKey], 'pascal')
                    const name = options.name as string
                    cls = (globalThis as any).apify[name].get(caseUtils.set(clsName, 'pascal'), value) // NOTE: This is a tightly-coupled dependency—but magically creates the right class (if properly constrained)
                    if (cls) value = new cls(value, options)
                }

                // Transform object into a class
                if (cls) value = new cls(value, options)

                // Process based on the user-defined callback
                else value = getValue(key, value, spec)

                // // Return the specification value if the value is undefined
                // if (!value && spec) value = spec

                
                // // Move all metadata from the existing value
                // if (value && typeof value === 'object') {
                // //   const hasPrevious = (og && typeof og === 'object')
                // //   const keys = getAllPropertyNames((hasPrevious) ? og : o) 

                //   // Set Attribute Keys
                //   const attributes = spec.attributes ?? []
                //   attributes.forEach((o:any) => {
                //     const value = o.value ?? o.default_value
                //     Object.defineProperty(value, o.name, { value, enumerable: true })
                //   })
                // }

                return value
            },

            specification: specs, // Merged together...
        })

        // Apply file info to the class (basd on the spec in the model)
        model.apply(info, { target: this })

        if (info.name) this.name = info.name // Transfer name

    }
}

export default ApifyBaseClass
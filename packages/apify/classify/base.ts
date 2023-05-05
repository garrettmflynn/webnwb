import { OptionsType } from "../types";
import { hasNestedGroups, isTypedGroup } from "../utils/globals";

// HDF5-IO
// import { isGroup as isGroupType } from '../../../../hdf5-io/src';
import { isGroup as isGroupType } from 'hdf5-io';

// import * as conform from "../../../../esmodel/src/index";
import * as conform from 'esconform';

export type ClassOptionsType = {
    // Use to skip autorejection and otherwise generate values
    onRejectKey?: (key: string | symbol, value:any, info:any) => any, // return to include the value
    transformToSnakeCase?: boolean,
} & Partial<OptionsType>


// NOTE: The only thing this can't catch is the type suggestions of the parent group (for user-specified keys out of the spec)
const mustTransform = (value: any, options: ClassOptionsType, spec: any | string = value) => {

    let cls: any; 
    let clsName: string | undefined;
    // if (typeof spec === 'string') clsName = spec
    // else {
        const clsKeys = [
            options.classKey,  // User-specified class key
            options.specClassKey, // Spec-specified class key
            // options.inheritKey, // User-specified inheritance key
        ]

        const foundClsKey = clsKeys.find(key => key && spec && typeof spec === 'object' && key in spec)
        clsName = spec[isTypedGroup] ?? (foundClsKey ? spec[foundClsKey] : undefined)
    // }
    
    if (clsName) {
        // const clsName = caseUtils.set(clsName, 'pascal')
        const name = options.name as string
        cls = (globalThis as any).apify[name].get(clsName, value) // NOTE: This is a tightly-coupled dependency—but magically creates the right class (if properly constrained)
        if (cls) {
            if (value instanceof cls) return false // Don't re-apply the class
            else return cls
        } else return null
    } else return null
}

const transformClass = (value: any, options: ClassOptionsType, spec: any | string) => {
    const cls = mustTransform(value, options, spec)
    if (cls === null) return null
    else if (cls === false) return false
    else return new cls(value, options)
}

class ApifyBaseClass {

    // [createQueueSymbol]: any;

    [x: string|symbol]: any; // arbitrary

    constructor(info: any = {}, options: ClassOptionsType = {}, specs: any[] = []) {

        // Object.defineProperty(this, createQueueSymbol, {value: {}}) // ensure queue property is non-enumerable

        const getValue = (typeof options.getValue === 'function') ? options.getValue : ((_, v) => v) as OptionsType['getValue']

        const name = info.name
        try { delete info.name } catch {} // Avoid setting the name as an esconform property

        const model = new conform.Model({
            
            keys: (key: string | symbol | number, specObj: any) => {

                const isPropertyOfGroup = specObj[isGroupType] && !specObj[hasNestedGroups]

                const toReturn = { 
                    value: key, 
                    // silence: false  // silence nothing...
                 } as any

                // Allow for the enumerability of groups with arbitrary names...
                if (isPropertyOfGroup) {
                    // const desc = Object.getOwnPropertyDescriptor(specObj, key) as PropertyDescriptor
                    // toReturn.enumerable = desc?.enumerable ?? true // Properly enumerate properties on top-level groups
                    // NOTE: This is a missed opportunity to allow for defaulting to the origina object's descriptor...
                    toReturn.silence = false // Do not silence arbitrary properties
                }

                return toReturn
            },

            values: (
                key: string | symbol | number, 
                value: any, 
                spec: any,
                // specObject: any
            ) => {

                if (spec?.[isTypedGroup]) {}

                // Handle missing values
                else if (value === undefined && spec !== undefined) {
                    if (spec[isGroupType]) value = {} // Resolve untyped groups as empty objects
                    else {

                        // Provide the specification as a value if not an object
                        if (spec) {
                            if (typeof spec !== 'object') value = spec
                            else if (spec instanceof Object) return spec // Directly return the spec if a complex class instance
                        }
                    }
                }

                // Handle class transformations
                let returned
                if (value !== undefined) {
                    returned = transformClass(value, options, spec) // Transform value (if defined) into a class using automatic class recognition
                    // if (activated) console.error('path (Transform)', path, res, value)
                }
                
                // Forward non-classes to users
                if (!returned) returned = getValue(key, value, spec) // Process based on the user-defined callback

                return returned
                
                // EQUIVALENT BUT HARDER TO SEPARATE LOGIC
                // return ((value === undefined) ? undefined : transformClass(value, options, spec))// Transform value (if defined) into a class using automatic class recognition
                //     ?? getValue(key, value, spec) // Process based on the user-defined callback
                
            },

            specification: specs, // Will merge
        })

        // Apply file info to the class (basd on the spec in the model)
        const proxy = model.apply(info, { target: this })

        if ( name && !this.name) Object.defineProperty(this, 'name', { value: name }) // Define name out of spec / proxy. Will be accessible

        return proxy // Provide a proxy of the class rather than the class itself...

    }
}

export default ApifyBaseClass
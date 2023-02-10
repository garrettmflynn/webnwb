import * as caseUtils from "../../../src/utils/case";
import { OptionsType } from "../types";
import { hasNestedGroups } from "../utils/globals";

// HDF5-IO
// import { isGroup as isGroupType } from '../../../../hdf5-io/src';
import { isGroup as isGroupType } from 'hdf5-io';

// import * as conform from "../../../../esmodel/src/index";
import * as conform from 'esconform'

export type ClassOptionsType = {
    // Use to skip autorejection and otherwise generate values
    onRejectKey?: (key: string | symbol, value:any, info:any) => any, // return to include the value
    transformToSnakeCase?: boolean,
} & Partial<OptionsType>


const mustTransform = (value: any, options: ClassOptionsType) => {
    const clsKey = options.classKey as string
    const specClassKey = options.specClassKey

    let cls: any; 
    const clsKeys = [
        clsKey,  // User-specified class key
        specClassKey // Spec-specified class key
    ]
    const foundClsKey = clsKeys.find(key => key && value && typeof value === 'object' && key in value)
    if (foundClsKey) {
        const clsName = caseUtils.set(value[foundClsKey], 'pascal')
        const name = options.name as string
        cls = (globalThis as any).apify[name].get(clsName, value) // NOTE: This is a tightly-coupled dependency—but magically creates the right class (if properly constrained)
        if (cls) {
            if (value instanceof cls) return false // Don't re-apply the class
            else return cls
        } else return null
    } else return null
}

const transformClass =(value: any, options: ClassOptionsType) => {
    const cls = mustTransform(value, options)
    if (cls === null) return value
    else if (cls === false) return false
    else return new cls(value, options)
}

class ApifyBaseClass {

    // [createQueueSymbol]: any;

    [x: string|symbol]: any; // arbitrary

    constructor(info: any = {}, options: ClassOptionsType = {}, specs: any[] = []) {

        // Object.defineProperty(this, createQueueSymbol, {value: {}}) // ensure queue property is non-enumerable

        const getValue = (typeof options.getValue === 'function') ? options.getValue : ((_, v) => v) as OptionsType['getValue']

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

            // NOTE: Internal keys are not transformed here...
            values: (key: string | symbol | number, value: any, spec: any) => {
                
                // ensure groups are resolved as objects
                if (spec?.[isGroupType] && value === undefined) value = {}

                // Recognize class keys to allow for automatic class transformations
                const transformed = transformClass(value, options)

                // Transform object into a class
                if (transformed) return transformed

                // Process based on the user-defined callback
                else return getValue(key, value, spec)
                
            },

            specification: specs, // Merged together...
        })

        // Apply file info to the class (basd on the spec in the model)
        model.apply(info, { target: this })

        if ( info.name )  Object.defineProperty(this, 'name', { value: info.name }) // Define name out of spec

    }
}

export default ApifyBaseClass
import ApifyBaseClass, { ClassOptionsType } from "./apify/classify/base";

const additionalGroupKey = {
    name: (self: any) => self.name,
    namespace: (self: any) => self.namespace,
    neurodataType: (self: any) => self.neurodata_type,
    objectId: (self: any) => self.object_id,
}

let thrownError = false 

export default class NWBBaseClass extends ApifyBaseClass {

    constructor (info:any, options: ClassOptionsType = {}) {

        if (!options.onRejectKey) options.onRejectKey = function (key:string, value:any) {
            if (!thrownError) {
                thrownError = true
                console.warn(`[classify]: Currently not checking for whether keys are out of schema...`);
            }
            return value
            // if (key in additionalGroupKey) return value // TODO: Ensure that this checks the specification more robustly
        }

        super(info, options)
    }
}
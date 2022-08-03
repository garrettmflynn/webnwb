import ApifyBaseClass from "./apify/classify/base";


const additionalGroupKey = {
    name: (self) => self.name,
    namespace: (self) => self.namespace,
    neurodataType: (self) => self.neurodata_type,
    objectId: (self) => self.object_id,
}

export default class NWBBaseClass extends ApifyBaseClass {

    constructor (info:any) {

        console.log('Getting info', info)
        super(info, {
            onRejectKey: (key:string, value:any, info: any) => {
                if (key in additionalGroupKey) return value
            }
        })
    }
}
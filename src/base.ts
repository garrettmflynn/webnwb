import ApifyBaseClass, { ClassOptionsType } from "../packages/apify/classify/base";

export default class NWBBaseClass extends ApifyBaseClass {

    constructor (info:any, options: ClassOptionsType = {}, specs: any[] = []) {
        super(info, options, specs)
    }
}
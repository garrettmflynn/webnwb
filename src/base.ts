import ApifyBaseClass, { ClassOptionsType } from "./apify/classify/base";

export default class NWBBaseClass extends ApifyBaseClass {

    constructor (info:any, options: ClassOptionsType = {}) {
        super(info, options)
    }
}
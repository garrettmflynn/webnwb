import { ClassifyInfo } from "../packages/apify/classify/types";
import ApifyBaseClass, { ClassOptionsType } from "../packages/apify/classify/base";

export default class NWBBaseClass extends ApifyBaseClass {

    constructor (info:any, options: ClassOptionsType = {}, specs: any[] = [], classifyInfo: ClassifyInfo) {
        super(info, options, specs, classifyInfo)
    }
}
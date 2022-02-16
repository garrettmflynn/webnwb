// import { NWBDataInterface } from './io/core';

type NWBDataInterface = any

export class TimeSeries   {
    name: string;
    unit: string;
    data: any;
    options: {[x:string] : any};

    constructor(name:string, data:any, unit:string='meters', options:{[x:string] : any}) {
        this.name = name
        this.data = data
        this.unit = unit

        this.options = options
    }
}

/* 
    Processing module. This is a container for one or more containers
    that provide data at intermediate levels of analysis
    ProcessingModules should be created through calls to NWB.create_module().
    They should not be instantiated directly
*/

export class ProcessingModule 
// extends NWBDataInterface 
{

    description: string;
    dataInterfaces: {[x:string]: NWBDataInterface} = {}

    constructor(_:string, description:string, interfaces:NWBDataInterface[]=[]) {
        // super(name)
        this.description = description
        if (Array.isArray(interfaces)) interfaces.forEach(o => this.dataInterfaces[o.name] = o)
        else this.dataInterfaces = interfaces
    }

    containers = () => this.dataInterfaces
    get = (name:string) => this.dataInterfaces[name]
    add = (o:NWBDataInterface) => this.dataInterfaces[o.name] = o
}
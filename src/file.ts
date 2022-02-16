// import { TimeSeries, ProcessingModule } from './base'
// import { NWBDataInterface } from './io/core'
import { ArbitraryObject } from './types/general.types'

export class NWBFile {

    [x:string]: any;

    constructor(info:ArbitraryObject = {}) {

        // Create Generic File Object
        delete info['.specloc']
        Object.assign(this, info)

        // Populate with Data from Info
        console.log(this, info)
    }

    // // ------------------ Trial Methods ------------------

    // addTrialColumn(label: string, description: string){
    //     console.error('nwbjs.addTrialColumn not implemented', label, description)
    // }

    // addTrial(start:number, end:number, label: string){
    //     console.error('nwbjs.addTrial not implemented', start, end, label)
    // }

    // // ------------------ Epoch Methods ------------------
    // addEpoch(start:number, end:number, labels: string[], series: TimeSeries[] = []){
    //     console.error('nwbjs.addEpoch not implemented', start, end, labels, series)
    // }

    // // ------------------ Unit Methods ------------------

    // addUnitColumn(label:string, description:string){
    //     console.error('nwbjs.addUnitColumn not implemented', label, description)
    // }
    
    // addUnit(id:number, spikeTimes:number[], obsIntervals:(number[])[], location:string, quality:number){
    //     console.error('nwbjs.addUnit not implemented', id, spikeTimes, obsIntervals, location, quality)
    // }

    // // ------------------ Module Methods ------------------
    // createProcessingModule = (name:string, description:string, interfaces:NWBDataInterface[]=[]) => {
    //     const module = new ProcessingModule(name, description, interfaces)
    //     this.addProcessingModule(module)
    // }

    // addProcessingModule = (o:ProcessingModule) => {
    //     this.processing[o.name] = o
    // }

    // addAcquisition = (o:TimeSeries) => {
    //     this.acquisition[o.name] = o
    // }

    // getAcquisition = (name:string) => {
    //     return this.acquisition[name]
    // }
}
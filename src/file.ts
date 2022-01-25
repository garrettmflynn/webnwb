import { TimeSeries, ProcessingModule } from './base'
import { NWBDataInterface } from './io/core'

export class NWBFile {

    // hdf5: File
    acquisition: {[x:string] : TimeSeries} = {}
    processing: {[x:string] : ProcessingModule} = {}

    constructor() {

    }
    // ------------------ Trial Methods ------------------

    addTrialColumn(label: string, description: string){

    }

    addTrial(start:number, end:number, label: string){

    }

    // ------------------ Epoch Methods ------------------
    addEpoch(start:number, end:number, labels: string[], series: TimeSeries[] = []){

    }

    // ------------------ Unit Methods ------------------

    addUnitColumn(label:string, description:string){

    }
    
    addUnit(id:number, spikeTimes:number[], obsIntervals:(number[])[], location:string, quality:number){
        
    }

    // ------------------ Module Methods ------------------
    createProcessingModule = (name:string, description:string, interfaces:NWBDataInterface[]=[]) => {
        const module = new ProcessingModule(name, description, interfaces)
        this.addProcessingModule(module)
    }

    addProcessingModule = (o:ProcessingModule) => {
        this.processing[o.name] = o
    }

    addAcquisition = (o:TimeSeries) => {
        this.acquisition[o.name] = o
    }

    getAcquisition = (name:string) => {
        return this.acquisition[name]
    }
}
import { TimeSeries } from './base'
import { NWBDataInterface } from './io/core'

export class Position extends NWBDataInterface {

    series: {[x:string]: SpatialSeries} = {}

    constructor(name:string='Position') {
        super(name)
    }

    createSpatialSeries = (name:string, data:any, referenceFrame:string, unit:string='meters', options: {[x: string] : any}) => {
        const series = new SpatialSeries(name, data, referenceFrame, unit, options)
        this.addSpatialSeries(series)
    }

    addSpatialSeries = (series:SpatialSeries) => {
        this.series[series.name] = series
    }
}

export class SpatialSeries extends TimeSeries {

    referenceFrame:string;

    constructor(name:string, data:any, referenceFrame:string, unit:string='meters', options: {[x: string] : any}) {
        super(name, data, unit, options)
        this.referenceFrame = referenceFrame
    }

}
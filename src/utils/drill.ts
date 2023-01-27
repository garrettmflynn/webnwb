const  drill = (object: any, fnToApply: Function, conditions:{drill?: Function, run?: Function} = {}, parent: any = undefined, path:string[]=[]) => {
    if (conditions.run === undefined || conditions.run(object)) {
        const toContinue = fnToApply(object, path, parent)
        if (toContinue === false) return false
        // if (exists) accumulator = exists
    }
    for (let k in object){
        const val = object[k]
        if (conditions.drill ? conditions.drill(val) : (val && val.constructor?.name === 'Object')) {
            const res = drill(val, fnToApply, conditions, object, [...path, k])
            // if (exists) accumulator = exists
            if (res === false) return
        }
    }

    // return accumulator
}

export default drill
const  drill = (object: any, conditions:{drill: Function, run: Function}, fnToApply: Function, accumulator={}, path:string[]=[]) => {
    if (conditions.run(object)) {
        let exists = fnToApply(object, path, accumulator)
        if (exists) accumulator = exists
    }
    for (let k in object){
        const val = object[k]
        if (conditions.drill(val)) {
            let exists = drill(val, conditions, fnToApply, accumulator, [...path, k])
            if (exists) accumulator = exists
        }
    }

    return accumulator
}

export default drill
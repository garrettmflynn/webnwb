import { NWBAPI } from 'src'

export * from './classes'
import * as classes from './classes/index'

const dependencies = {
    'NWBFile': [
        ['general', 'subject']
    ]
}

export const validate = (object: any, api: NWBAPI) => {

    return Object.entries(classes as { [x: string]: { [x: string]: Function } })
    .reduce((acc, [cls, funcs]) => {
        try {
            if (object instanceof api[cls]) {

                // Validate this object
                acc.push(...Object.values(funcs).map(f => f(object))) 

                // Check for linked objects
                if (dependencies[cls]) {
                    dependencies[cls].forEach(path => {
                        let target: any = object;
                        path.forEach((str: string) => target = target[str])
                        const validated = validate(target, api)
                        console.log('Validated', cls, path, validated, target)
                        acc.push(...validated)
                    })
                }
            }
        } catch (e) {
            console.warn(`Test for ${cls} failed...`, e)
        }
        return acc
    }, []).filter((v: any) => v)
}
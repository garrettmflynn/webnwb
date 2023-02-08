import * as caseUtils from '../../../src/utils/case'

export const isClass = (str:string) => {
    return caseUtils.get(str) === 'pascal' // Assume pascal case
}


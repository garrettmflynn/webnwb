import * as caseUtils from '../../utils/case'

export const isClass = (str:string) => {
    return caseUtils.get(str) === 'pascal' // Assume pascal case
}


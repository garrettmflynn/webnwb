
import { InspectorMessage, parseISO8601Duration } from "../utils";

const durationRegexp = new RegExp("^P(?!$)(\d+(?:\.\d+)?Y)?(\d+(?:\.\d+)?M)?(\d+(?:\.\d+)?W)?(\d+(?:\.\d+)?D)?(T(?=\d)(\d+(?:\.\d+)?H)?(\d+(?:\.\d+)?M)?(\d+(?:\.\d+)?S)?)?$")
const speciesFormRegexp = new RegExp("([A-Z][a-z]* [a-z]+)|(http://purl.obolibrary.org/obo/NCBITaxon_\d+)")

export function checkSubjectAge(subject: any) {

    if (!subject.age) {
        if (subject.date_of_birth) return
        else return new InspectorMessage({
            message: `Subject is missing age and date_of_birth`,
        })
    }

    if (durationRegexp.test(subject.age)) return

    if (subject.age.includes('/')) {
        let [minAge, maxAge] = subject.age.split('/')
        if (durationRegexp.test(minAge) && (durationRegexp.test(maxAge) || maxAge === '')) return
    }

    return new InspectorMessage({
        message: `Subject age, '${subject.age}', does not follow ISO 8601 duration format, e.g. 'P2Y' for 2 years or 'P23W' for 23 weeks. You may also specify a range using a '/' separator, e.g., 'P1D/P3D' for an age range somewhere from 1 to 3 days. If you cannot specify the upper bound of the range, you may leave the right side blank, e.g., 'P90Y/' means 90 years old or older.`
    })
}

export function checkSubjectProperAgeRange(subject: any) {
    if (!subject.age && subject.age.includes('/')) {
        let [minAge, maxAge] = subject.age.split('/')
        if (durationRegexp.test(minAge) && durationRegexp.test(maxAge)) {
            let minAgeInDays = parseISO8601Duration(minAge)
            let maxAgeInDays = parseISO8601Duration(maxAge)
            if (minAgeInDays > maxAgeInDays) {
                return new InspectorMessage({
                    message: `The durations of the Subject age range, '${subject.age}', are not strictly increasing. The upper (right) bound should be a longer duration than the lower (left) bound.`
                })
            }
        }
    }
}

export function checkSubjectIdExists(subject: any) {
    if (!subject.subject_id) {
        return new InspectorMessage({
            message: `subject_id is missing`,
        })
    }
}

export function checkSubjectSex(subject: any) {
    if (!subject.sex) return new InspectorMessage({ message: "Subject sex is missing." })

    else if (!["M", "F", "O", "U"].includes(subject.sex))  return new InspectorMessage({ message: "Subject sex should be one of: 'M' (male), 'F' (female), 'O' (other), or 'U' (unknown)."})
}

export function checkSubjectSpeciesExists(subject: any) {
    if (!subject.species) return new InspectorMessage({ message: "Subject species is missing." })
}

export function checkSubjectSpeciesForm(subject: any) {
    if (!subject.species) return

    if (!speciesFormRegexp.test(subject.species)) {
        return new InspectorMessage({
            message: `Subject species '${subject.species}' should be in latin binomial form, e.g. 'Mus musculus' and 'Homo sapiens'`,
        })
    }
}

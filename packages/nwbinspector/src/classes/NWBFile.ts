import { InspectorMessage } from "../utils";
const nameRegexp = /^([\w\s\-\.']+),\s+([\w\s\-\.']+)$/

export function checkSessionStartTimeOldDate(file: any) {
    if ((new Date(file.session_start_time)).getTime() <= (new Date('1/1/1980')).getTime()) {
        return new InspectorMessage({
            message: `The session_start_time (${file.session_start_time}) may not be set to the true date of the recording.`,
        })
    }
}

export function checkSessionStartTimeFuture(file: any) {
    if ((new Date(file.session_start_time)).getTime() >= (new Date()).getTime()) {
        return new InspectorMessage({
            message: `The session_start_time (${file.session_start_time}) is set to a future date and time.`,
        })
    }
}

export function checkExperimenterExists(file: any) {
    // if (!file.experimenter) {
    if (!file.general.experimenter) {
        return new InspectorMessage({
            message: `Experimenter is missing`,
        })
    }
}

export function checkExperimenterForm(file: any) {
    const experimenters = file.general.experimenter // file.experimenter
    if (!experimenters) return

    for (let experimenter of experimenters) {
        if (!nameRegexp.test(experimenter)) {
            return new InspectorMessage({
                message: `The name of experimenter (${experimenter}) does not match any of the accepted DANDI forms: 'LastName, FirstName', 'LastName, FirstName MiddleInitial.', or 'LastName, FirstName MiddleName'`,
            })
        }
    }
}

export function checkExperimentDescription(file: any) {
    // if (!file.experiment_description) {
    if (!file.general.experiment_description) {
        return new InspectorMessage({
            message: `Experiment description is missing`,
        })
    }
}

export function checkInstitution(file: any) {
    // if (!file.institution) {
    if (!file.general.institution) {
        return new InspectorMessage({
            message: `Metadata /general/institution is missing`,
        })
    }
}

export function checkKeywords(file: any) {
    // if (!file.keywords) {
    if (!file.general.subject) {
        return new InspectorMessage({
            message: `Metadata /general/keywords is missing`,
        })
    }
}

export function checkSubjectExists(file: any) {
    // if (!file.subject) {
    if (!file.general.subject) {
        return new InspectorMessage({
            message: `Subject is missing`,
        })
    }
}

export function checkDOIPublications(file: any) {
    if (!file.related_publications) return

    const startsWith = ['doi:', 'https://doi.org/', 'http://dx.doi.org/']

    for (let publication of file.related_publications) {
        if (!startsWith.find(prefix => publication.startsWith(prefix))) {
            return new InspectorMessage({
                message: `Metadata /general/related_publications (${publication}) does not start with 'doi: ###' and is not an external 'doi' link.`,
            })
        }
    }
}
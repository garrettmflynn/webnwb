import nwb from '../src/index';

export default () => {

    const file = createNWBFile()
    addSubject(file) // Subject
    const behavior = addBehavior(file) // Behavior
    addBehaviorEvents(behavior) // Behavior Events

    return file // Return the NWB file to be saved
}

export const addSubject = (file: any) => {

     // Subject
     const subject = {
        subject_id: Math.random().toString(36).substring(7),
        // age: "P90D",
        // description: "someone using the website",
        species: "Homo sapien",
        // sex: "U",
    }


    // -------- NOTE: All of these methods are equivalent --------
    file.general.subject = subject  
    // file.general.subject = new nwb.Subject(subject) 
    // file.subject = subject // Silenced
    // file.createSubject(subject)
    // file.addSubject(new nwb.Subject(subject))
    // file.addSubject(subject)

    return file.general.subject
}

export const addBehavior = (file: any) => {

    const spatialSeries = new nwb.behavior.SpatialSeries({
        name: 'cursor',
        description: 'The position (x, y) of the cursor over time.',
        data: [[], []], // NOTE: Not created if omitted
        timestamps: [],
        referenceFrame: '(0,0) is the top-left corner of the visible portion of the page.'
    })

    const position = new nwb.behavior.Position()
    position.addSpatialSeries(spatialSeries)

    const behavior = new nwb.ProcessingModule({ name: 'behavior', description: 'Behavioral data recorded while navigating a webpage.' })
    behavior.add(position) // NOTE: Might just want to be .add() | Convention is uppercase
    file.addProcessingModule(behavior)
    return behavior //file.processing.behavior // NOTE: The returned object will not correctly trigger stuff
    // return file.processing.behavior
}

export const addBehaviorEvents = (processingModule: any) => {
        // Create a TimeSeries object to track behavior events
        const data: any = []
        data.unit = 'ms'
    
        const behavioralEvents = new nwb.behavior.BehavioralEvents()
    
        // Use the create function...
        behavioralEvents.createTimeSeries({
            name: 'emojiReactions',
            description: 'The length of time the emoji was shown on the page.',
            data,
            timestamps: [],
            // unit: 'ms' // TODO: Accomodate moving this to the data object
        })
    
        // Add these behavioral events to the NWB file
        processingModule.add(behavioralEvents)

        return processingModule.emojiReactions // Return timeseries
}

export const createNWBFile = () => {
   return new nwb.NWBFile({
        session_description: 'EEG data and behavioral data recorded while navigating a webpage.',
        identifier: 'WebNWB_Documentation_Session_' + Math.random().toString(36).substring(7),
        session_start_time: Date.now(),
        experimenter: 'Garrett Flynn',
        institution: 'Brains@Play'
    })
}

export const save = async (file: any, filename?:string) => {
    const io = new nwb.NWBHDF5IO()
    const savedAs = io.save(file, filename)
    const fileFromLocalStorage = await io.load(savedAs)
    return fileFromLocalStorage
}
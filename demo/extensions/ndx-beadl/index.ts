import { NWBAPI, NWBHDF5IO } from '../../../src/index'

import ndxBEADLNamespaces from './ndx-beadl.namespace.yaml'
const beadlNamespace = ndxBEADLNamespaces.namespaces[0]
import ndxBEADLExtension from './ndx-beadl.extensions.yaml'

const beadl = new NWBAPI({
  [beadlNamespace.name]: {
      [beadlNamespace.version]: {
          namespace: ndxBEADLNamespaces,
          [`${beadlNamespace.name}.extensions`]: ndxBEADLExtension
      }
  }
})

// Get data for BEADL
import test_xsd from './files/BEADL.xsd?raw'
import test_xml from './files/LightChasingTask.xml?raw'
// import beadl_data_file from "./files/BeadlDataSample.mat?raw"

const beadl_task_schema = new beadl.BEADLTaskSchema({
  name: 'task_schema',
  data: test_xsd,
  version: "0.1.0",
  language: "XSD"
})

const beadl_task_program = new beadl.BEADLTaskProgram({
  name: 'task_program',
  data: test_xml,
  schema: beadl_task_schema,
  language: "X"
})

const task_arg_table = new beadl.TaskArgumentsTable({
  beadl_task_program: beadl_task_program, 
  populate_from_program: true
})

const event_types = new beadl.EventTypesTable({
  description: "description", 
  beadl_task_program: beadl_task_program,
  populate_from_program: true
})

const action_types = new beadl.ActionTypesTable({
  description: "description", 
  beadl_task_program: beadl_task_program,
  populate_from_program: true
})

const state_types = new beadl.StateTypesTable({
  description: "description", 
  beadl_task_program: beadl_task_program,
  populate_from_program: true
})

const task = new beadl.Task({
  task_program: beadl_task_program,
  task_schema: beadl_task_schema,
  event_types,
  state_types,
  action_types,
  task_arguments: task_arg_table
})

console.log('API (beadl)', beadl)

console.error('[beadl]: populate_from_matlab is not a method implemented by WebNWB')

// Create Events, Actions, and States
const events = new beadl.EventsTable({
  description: "description", 
  event_types_table: event_types
})
// _ = events.populate_from_matlab(data_path=beadl_data_file)

const actions = new beadl.ActionsTable({
  description: "description", 
  action_types_table: action_types
})
// _ = actions.populate_from_matlab(data_path=beadl_data_file)

const states = new beadl.StatesTable({
  description: "description", 
  state_types_table: state_types
})
// _ = states.populate_from_matlab(data_path=beadl_data_file)

const trials = new beadl.TrialsTable({
  description: "description", 
  states_table: states, 
  events_table: events, 
  actions_table: actions
})

// _ = trials.populate_from_matlab(data_path=beadl_data_file)

// Create NWBFile
const nwbfile = new beadl.NWBFile({
  session_description: "session_description",
  identifier: "LightChasingTask",
  session_start_time: (new Date()).toISOString(),

  subject: new beadl.Subject({
    subject_id: "SP_W2_RH"
  })
})

console.log('BEADL File', nwbfile)
// Add Beadl Data
console.error('[beadl]: lab_meta_data is not a property contained in the NWB Schema')
// nwbfile.add_lab_meta_data(task) // NOTE: Cannot implement based on schema
nwbfile.addAcquisition(states)
nwbfile.addAcquisition(events)
nwbfile.addAcquisition(actions)
nwbfile.trials = trials // NOTE: Not sure where this will go

// // Write the NWBFile
console.error('[beadl]: Cannot write certain aspects of the BEADL demo')
// // NOTE: This is broken at the moment
// const io = new NWBHDF5IO()
// const saveName = await io.save(nwbfile, 'beadl.nwb') as string
// const reloaded = io.load(saveName)
// console.log('Reloaded BEADL', reloaded, nwbfile)

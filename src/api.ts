import { ArbitraryObject } from './types/general.types';
import schemas from './schema'
import API from './apify';
import NWBBaseClass from './base';

const latest = Object.keys(schemas).shift() as string // First value should always be the latest (based on insertion order)
type SpecificationType = { 'core': ArbitraryObject } & ArbitraryObject

// Generate the NWB API from included specification
export default class NWBAPI extends API {

  _nameToSchema: ArbitraryObject = {};
  extensions: ArbitraryObject = {};
  _latest: string = latest;

  [x: string]: any;

  constructor(
    specification: SpecificationType = schemas[latest] ?? { core: {} }, // Fallback to latest schema or empty specification
    debug = false // Show Debug Messages
  ) {

    super(specification, {
      debug, // Show Debug Messages
      name: 'webnwb', // Name of the API
      methodName: ['neurodata_type_def',  'data_type_def', 'name', 'default_name' ],
      allCaps: ['NWB'], // Ensure these strings are always capitalized
      coreName: 'core', // Name of the core schema
      namespacesToFlatten: ['base', 'file'], // Namespaces to flatten into the base of the API
      patternsToRemove: ['nwb.', '.extensions', '.yaml'], // Patterns to remove from the name
      baseClass: NWBBaseClass, // Base Class to use for all classes
      getValue: (o) => o.value ?? o.default_value, // Get the value from the schema

      classKey: 'neurodata_type', // Key to use for the class name

      // Override properties of a generated class instance
      overrides: {

        nwbDataInterface: 'dataInterface',

        NWBFile: {
          Processing: 'ProcessingModule'
          // addProcessing: 'addProcessingModule',
          // createProcessing: 'createProcessingModule',
          // getProcessing: 'getProcessingModule',
        },
      },

      // In pascal case
      singularName: {
        Devices: 'Device',
        Electrodes: 'Electrode',
        Epochs: 'Epoch',
        ExperimentalConditions: 'ExperimentalCondition',
        Templates: 'Template',
        Trials: 'Trial',
        Units: 'Unit',
      }
    })

    this._generate()

  }
}

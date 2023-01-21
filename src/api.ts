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

      // Get the value from the schema
      getValue: (value, o) => {

        if (value === undefined) value = o.value ?? o.default_value

        if (value === undefined) return value // return value

        let toReturn = value

          if (o.quantity) {
            // if (o.shape) {
              if (typeof o.dtype === 'string') {
                const arrayType = `${o.dtype[0].toUpperCase() + o.dtype.slice(1)}Array`
                const typedArray = globalThis[arrayType]
                if (typedArray) toReturn = new typedArray(value)
              }
              
              toReturn = new Array(value)
            // }
          } 
          else if (typeof o.dtype === 'string') {
            const typeOf = typeof value
            if (o.dtype === 'isodatetime' && (typeOf === 'string' || typeOf === 'number' || value instanceof Date)) toReturn = new String(new Date(value).toISOString()) // Return as a object here
            if (typeOf === 'string') {
              if (o.dtype === 'text') toReturn = new String(value)
            }
            else if (typeOf === 'number') {
              if (o.dtype === 'numeric' || o.dtype.includes('float') || o.dtype.includes('int')) toReturn = new Number(value)
            }
            // else console.error('Unknown dtype', o.dtype, o)
            // else if (o.dtype === 'bool') return new Boolean(value)
            // else if (o.dtype === 'float') return new Number(value)
          }

          return toReturn
      },

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

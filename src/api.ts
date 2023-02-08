import { ArbitraryObject } from './types/general.types';
import schemas from './schema'
import API from '../packages/apify';
import NWBBaseClass from './base';
// import { objectify } from '../../hdf5-io/src';
import { objectify } from 'hdf5-io/dist/index.esm';

const latest = Object.keys(schemas).shift() as string // First value should always be the latest (based on insertion order)
type SpecificationType = { 'core': ArbitraryObject } & ArbitraryObject

const getNamespaceKey = (str: string) => str.replace('.yaml', '')//.replace('.extensions', '')

var TypedArray = Object.getPrototypeOf(Uint8Array);

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
      namespacesToFlatten: ['nwb.base', 'nwb.file'], // Namespaces to flatten into the base of the API
      getNamespaceKey, // Get the key for the namespace
      getNamespaceLabel: (str: string) => getNamespaceKey(str.replace('.nwb', '')), // Get the key for the namespace

      baseClass: NWBBaseClass, // Base Class to use for all classes

      // Get the value from the HDF5 schema
      getValue: (key, value, o) => {

        if (o  === undefined) return value // No schema

        if (value === undefined) value = o.value ?? o.default_value // Set to default value if not defined

        if (value === undefined) return value // return undefined value

        let toReturn = value
    
        const constructor = value?.constructor

        // -------------- BigInt Support --------------
        if (constructor === BigInt) toReturn = Number(toReturn);
        
        // -------------- HDF5 Schema Support --------------
          if (o.shape) {
            // if (o.shape) {
              if (typeof o.dtype === 'string') {
                const arrayType = `${o.dtype[0].toUpperCase() + o.dtype.slice(1)}Array`
                const typedArray = globalThis[arrayType]
                if (typedArray) value = new typedArray(value)
              }
              
              toReturn = (Array.isArray(value) || (value instanceof TypedArray) ? value : [value]) // Create an array object here (if required)
            // }
          } 
          else if (typeof o.dtype === 'string') {
            const typeOf = typeof value
            if (o.dtype === 'isodatetime' && (typeOf === 'string' || typeOf === 'number' || value instanceof Date)) toReturn = objectify(new Date(value).toISOString()) // Return as a object here
            if (typeOf === 'string') {
              if (o.dtype === 'text') toReturn = objectify(value)
            }
            else if (typeOf === 'number') {
              if (o.dtype === 'numeric' || o.dtype.includes('float') || o.dtype.includes('int')) toReturn = objectify(value)
            }
            // else console.error('Unknown dtype', o.dtype, o)
            // else if (o.dtype === 'bool') return new Boolean(value)
            // else if (o.dtype === 'float') return new Number(value)
          }


          return toReturn
      },

      classKey: 'neurodata_type', // Key to use for the class name
      specClassKey: 'neurodata_type_def',

      // Override properties of a generated class instance
      overrides: {

        nwbDataInterface: 'dataInterface', // NOTE: Why is this in camel case?

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

    //  Move the specification to the file declaration
    const core = this._specification.core
    const version = Object.keys(core)[0]

    const fileConfig = core[version]['nwb.file'].NWBFile
    fileConfig.specifications = specification // Add specification to the file


  }
}

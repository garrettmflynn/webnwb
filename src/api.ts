import { ArbitraryObject } from './types/general.types';
import schemas from './schema'
import API from '../packages/apify';
import NWBBaseClass from './base';
// import { changesSymbol, indexedDBFilenameSymbol, objectify } from '../../hdf5-io/src';
import { objectify } from 'hdf5-io';
import { v4 as uuidv4 } from 'uuid';

export const apiSymbol = Symbol('api')

const latest = Object.keys(schemas).shift() as string // First value should always be the latest (based on insertion order)
type SpecificationType = { 'core': ArbitraryObject } & ArbitraryObject

// type NamespaceURLArray = URL[]

const getNamespaceKey = (str: string) => str.replace('.yaml', '')//.replace('.extensions', '')

const isAnyArray = (value: any) => (Array.isArray(value) || (value instanceof TypedArray ));

var TypedArray = Object.getPrototypeOf(Uint8Array);

const baseSpec = schemas[latest] ?? {} 

// Generate the NWB API from included specification
export default class NWBAPI extends API {

  _nameToSchema: ArbitraryObject = {};
  extensions: ArbitraryObject = {};
  _latest: string = latest;

  [x: string]: any;

  constructor(
    specification: Partial<SpecificationType> = { core: {} }, // Fallback to empty specification
    debug = false // Show Debug Messages
  ) {

    // Merge partial spec with base spec
    for (let key in baseSpec) {
      if (!(key in specification) || !Object.keys(specification[key]).length) specification[key] = baseSpec[key]
    }

    super(specification, {
      debug, // Show Debug Messages
      name: 'webnwb', // Name of the API


      classKey: 'neurodata_type', // Key to use for the class name
      specClassKey: 'neurodata_type_def',
      // inheritKey: 'neurodata_type_inc', // Key to use for the class inheritance

      className: ['neurodata_type_def', 'data_type_def'], //, 'name', 'default_name'],
      inheritsFrom: ['neurodata_type_inc', 'data_type_inc'],
      propertyName: ['name', 'default_name'],

      coreName: 'core', // Name of the core schema

      getNamespaceKey, // Get the key for the namespace
      getNamespaceLabel: (str: string) => getNamespaceKey(str.replace('nwb.', '')), // Get the key for the namespace

      baseClass: NWBBaseClass, // Base Class to use for all classes

      onSchemaValue: (key: string, value: any, namespace: string) => {
        if ('neurodata_type_def' in value) {
          if (!value.namespace)  value.namespace = namespace // Set the namespace
          
          if (!('object_id' in value)) Object.defineProperty(value, 'object_id', {  writable: false,  enumerable: true });
        }
      },

      generateInstanceValue: [
        {
          key: 'object_id',
          fn: function(){
            return (!this.object_id) ? uuidv4() : this.object_id
          }
        }
      ],

      // Get the value from the HDF5 schema
      getValue: (key, value, o) => {

        if (o  === undefined) return value // No schema

        if (value === undefined) value = o.value ?? o.default_value // Set to default value if not defined

        if (value === undefined) return value // return undefined value

        let toReturn = value
    
        const constructor = value?.constructor

        // -------------- BigInt Support --------------
        if (constructor === BigInt) toReturn = Number(toReturn);


        const handleSingleValue = (value: any, expectedType?:string) => {

          let toReturn = value
          if (typeof expectedType === 'string') {

            const onMismatch = () => console.error(`Mismatched types for ${key as string}: ${expectedType} is expected but ${typeOf} was provided`, value, o)

              const typeOf = typeof value
              if (expectedType === 'isodatetime' && (typeOf === 'string' || typeOf === 'number' || value instanceof Date)) toReturn = objectify(new Date(value).toISOString()) // Return as a object here
              else if (expectedType === 'text') {
                if (typeOf === 'string') toReturn = objectify(value)
                else if (!(value instanceof String)) onMismatch()
              }
              else if (expectedType === 'numeric' || expectedType.includes('float') || expectedType.includes('int')) {
                if (typeOf === 'number') toReturn = objectify(value)
                else if (typeOf === 'bigint' || value instanceof globalThis.BigInt) toReturn = objectify(Number(value))
                else if (!(value instanceof Number)) onMismatch()
              }
            else console.error('Unconverted dtype', expectedType, value, typeOf, o)

            // else if (o.dtype === 'bool') return new Boolean(value)
            // else if (o.dtype === 'float') return new Number(value)
          }

          return toReturn
        }
        
        // -------------- HDF5 Schema Support --------------
        const name = value.constructor?.name ?? ''

          if (o.shape) {
            // if (o.shape) {
              let wasTypedArray

              // Try making a specific type of array
              if (typeof o.dtype === 'string') {
                const arrayType = `${o.dtype[0].toUpperCase() + o.dtype.slice(1)}Array`
                const typedArray = (globalThis as any)[arrayType] ?? (name !== 'Array' && name.includes('Array')) ? (globalThis as any)[value.constructor.name] : undefined
                if (typedArray) {
                  value = (isAnyArray(value) && value.length) ? new typedArray(value) : new typedArray()
                  wasTypedArray = arrayType
                }
              }
              
              toReturn = isAnyArray(value) ? value : (o.shape.length === 1 ? [value] : Array.from({length: o.shape.length}, (_,i) => (i === 0) ? [value] : [])) // Create an array object here (if required)

              // Otherwise map the values of the normal array
              if (wasTypedArray) return toReturn
              else {
                return toReturn.map((v: any) => {
                  if (Array.isArray(v)) return v.map((v: any) => handleSingleValue(v, o.dtype))
                  else return handleSingleValue(v, o.dtype)
                }) // Map single values
              }
            // }
          } 
          else if (name.includes('Array') && !Array.isArray(value)) return value // BigInt64 Arrays
          else return handleSingleValue(value, o.dtype)
      },

      // Override properties of a generated class instance
      overrides: {

        NWBDataInterface: '', // NOTE: Why is this in camel case?
        
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

    const fileConfig = core[version].file.NWBFile
    fileConfig.specifications = specification // Add specification to the file

    Object.defineProperty(fileConfig, apiSymbol, { value: this }) // Set API in the specification
  }

  // loadNamespace = async (namespaceURL: URL) => {
    
  // }

}

import { ArbitraryObject, AttributeType, GroupType, LinkType, DatasetType } from './types/general.types';
import schemas from './schema'
import { objToString, safeStringify } from './utils/parse';
const latest = Object.keys(schemas).shift() as string // First value should always be the latest (based on insertion order)

type SpecificationType = {'core':ArbitraryObject} & ArbitraryObject

// Generate the NWB API from included specification
export default class NWBAPI {

  _specification: SpecificationType
//   NWBFile?: ArbitraryObject;
  _debug: boolean;
  _nameToSchema: ArbitraryObject = {};
  extensions: ArbitraryObject = {};

  [x: string]: any;

  constructor(
      specification: SpecificationType = schemas[latest] ?? {core: {}}, // Fallback to latest schema or empty specification
      debug=false // Show Debug Messages
    ) {
    this._debug = debug
    this._specification = JSON.parse(JSON.stringify(specification)) // Deep copy
    this._generate(specification)
  }


  _inherit = (key:string, parentObject?:ArbitraryObject) => {
    
    const schema = this._nameToSchema[key]
    const namespace = schema?.namespace
    
    if (!parentObject) {
        schema.path.forEach((str:string) => {
            parentObject = this[str]
        })
    }
    
    if (parentObject){
      
      const o = parentObject[key]

      // const inheritedName = o.inherits
      const inheritedName = this._setCase(o.inherits) // set case
      const inheritedPath = this._nameToSchema[inheritedName]?.path

      let inherit:ArbitraryObject | undefined;
      if (inheritedPath){
        inherit = this
        inheritedPath.forEach((str:string) => {
            inherit = inherit?.[str] 
        })
        inherit = inherit?.[inheritedName]
    }
    
      delete parentObject[key].inherits

      if (inherit) {

        if (inherit.inherits) this._inherit(inheritedName) // Finish inheritance for parent first

        const deep = JSON.parse(JSON.stringify(inherit))
      
        parentObject[key] = Object.assign(deep, o)
      } else if (o.inherits) console.log(`[webnwb]: Cannot inherit ${inheritedName}`, o, namespace, schema, key)

      // Drill Into Objects
      if (typeof parentObject[key] === 'object') for (let k in parentObject[key]) {
          this._inherit(k, parentObject[key])
      }
    }
  }

  _baseName = (str: string) => {
    return str.replace('nwb', '')
  }

  _setCase = (base:string, type?: 'pascal' | 'camel') => {

    if (!base) return

    const setFirst = (str:string, method: 'toUpperCase' | 'toLowerCase' ='toUpperCase') => `${(str[0] ?? '')[method]()}${str.slice(1)}`
    switch(type){
      case 'pascal':
        return base.split('_').map(str => setFirst(str)).join('')

      default: 
        const split = base.split('_')

        const numCapital = Array.from(split.flat().join('')).reduce((acc, str) => {
          const condition = str.toUpperCase() === str && !parseInt(str)
          return acc + (condition ? 1 : 0)
        }, 0)
        if (numCapital === 0){
          return split.map((str, i) => {
            if (i) return setFirst(str)
            else return str.toLowerCase()
          }).join('')
        } else return base
    }
  }


  _generateHelperFunctions = (base:string | string[], valueToDrill?: any) => {

    let str = ''
    if (!Array.isArray(base)) base = [base]
    str += base.map((str, i) => {
    let caps = this._setCase(str, 'pascal')

    return `
        this.add${caps} = function add(obj) {
          this.${base}[obj.name] = obj
        };
        
        this.get${caps} = function get(name) { 
          this.${base}[name]
        };
      `
    }).join('\n')

    if (valueToDrill) {
      for (let key in valueToDrill) {
        if (typeof valueToDrill[key] === 'object' && valueToDrill[key]._base){ 
          delete valueToDrill[key]._base
          str += this._generateHelperFunctions(key, valueToDrill[key])
        }
      }
    }

    return str


  }

  _getClasses(schema:ArbitraryObject){

    for (let clsName in schema) {
      if (clsName !== '_base' && typeof schema[clsName] === 'object'){

        // Construct Class (attributes in function)
        const keys = Object.keys(schema[clsName])     
        
        // NOTES
        // 1. Iterate through the keys (still no transition of default_name)

        let base: string[];
        const mapped = keys.map((k:string) => {
          

          const val = schema[clsName][k]
          let str = ''

          if (k === '_base') {
            base = val
            delete schema[clsName][k]
          } else {

            if (typeof val === 'object' && val._base) {
              delete val._base
              str += `${this._generateHelperFunctions(k, val)};\n`
            }

            str += `this.${k} = ${JSON.stringify(val)}` // add base object
          }
          
          return str
        })

        const fnString =  `return function ${clsName}(o={}){
          ${mapped.join('\n')}
          Object.assign(this, o);
          ${base ? this._generateHelperFunctions(base) : ''}
        }`

          const generatedClass = new Function(fnString)();
          schema[clsName] = generatedClass
        }
    }

  }
  

  _setFromObject = (o: any, aggregator: ArbitraryObject = {}, type?:string, path:string[] = []) => {

    let name = (o.neurodata_type_def ?? o.data_type_def) ?? o.name ?? o.default_name
    const inherit = (o.neurodata_type_inc ?? o.data_type_inc)
    name = this._setCase(name)

    const newPath = [...path]

    if (name) {
          const value = o.value ?? o.default_value ?? {}
          if (aggregator[name] instanceof Function) aggregator[name].prototype[name] = inherit
          else aggregator[name] = value
          newPath.push(name)
    }

    // Assign default name (not always working...)
    if (o.default_name) {
      aggregator[name].name = o.default_name
    }


    if (inherit) {

      // Specify inherited class
      if (aggregator[name]){
        if (aggregator[name] instanceof Function) aggregator[name].prototype.inherits = inherit
        else aggregator[name].inherits = inherit 
      } 

      // Assign group helper functions
      if (type === 'group') {
        const base = this._baseName(inherit)
        if (!aggregator._base) aggregator._base = [base] // generate helpers on class instance
        else aggregator._base.push(base)
    }
    }


    // Attributes
    if (o.attributes) {
      o.attributes.forEach((attr: AttributeType) => {
        this._setFromObject(attr, aggregator[name] ?? aggregator, undefined, newPath)
      })
    }

    // Groups
    if (o.groups) {
      const aggregation = aggregator[name] ?? aggregator
      o.groups.forEach((group: GroupType) => {
        this._setFromObject(group, aggregation, 'group', newPath)
      })    
    }

    // Links
    if (o.links) {
      o.links.forEach((link: LinkType) => {
        this._setFromObject(link, aggregator[name] ?? aggregator, undefined, newPath)
      })
    }

    // Datasets
    if (o.datasets) {
      o.datasets.forEach((dataset: DatasetType) => {
        this._setFromObject(dataset, aggregator[name] ?? aggregator, undefined, newPath)
      })
    }

    return aggregator
  }

  _generate(spec: any = this._specification, key?:string) {

    let keys = (key) ? [key] : Object.keys(spec)
    keys.forEach((key:any) => {


    const o = JSON.parse(JSON.stringify(spec[key])) // Deep Copy Spec

    const isFormatted = !!o.namespace
    const version = (!o.namespace) ? Object.values(o)[0] : o // File OR Specification Format

    // Account for File vs Schema Specification Formats
    const namespaceInfo = version?.namespace // File OR Specification Format
    const namespace = (typeof namespaceInfo === 'string') ? JSON.parse(namespaceInfo) : namespaceInfo

    const schemas:string[] = []

    if (namespace){
    namespace.namespaces.forEach((namespace: any) => {

        const scopedSpec:ArbitraryObject = {}
        const tick = performance.now()
        if (namespace.name !== 'core' && this._debug) console.log(`[webnwb]: Loading ${namespace.name} extension.`)

      namespace.schema.forEach((schema: any) => {

        // Grabbing Schema
        if (schema.source) {

          // Differentiate Non-Core Elements
          const extension = namespace.name !== 'core'
          if (extension && !this.extensions[namespace.name]) this.extensions[namespace.name] = {}

          // Set Schema Information
          const name = schema.source
                        .replace('nwb.', '')
                        .replace('.extensions', '')
                        .replace('.yaml', '')

          const base = (extension) ? this.extensions[namespace.name] : this

          // Don't Overwrite Redundant Namespaces / Schemas

          if (!base[name]){

            base[name] = {}
            schemas.push(name)

            // Account for File vs Schema Specification Formats
            const schemaInfo = version[schema.source] ?? version[name]
            const info = (typeof schemaInfo === 'string') ? JSON.parse(schemaInfo) : schemaInfo
            
            base[name] = this._setFromObject(info, undefined, undefined, [name])

            // Track Object Namespaces and Paths
            for (let key in base[name]){
                this._nameToSchema[key] = (extension) ? {namespace: namespace.name, path: ['extensions', namespace.name, name]} : {namespace: namespace.name, path: [name]}
            }

            scopedSpec[name] = base[name]

        }
        }
      })

        // Generate Specification Registry
        if (isFormatted) delete this._specification[key] // Delete Pre-Formatted Specs
        this._specification[namespace.name] = {}
        this._specification[namespace.name][namespace.version] = scopedSpec

        // Show Performance
        const tock = performance.now()
        // if (this._debug) 
        console.log(`[webnwb]: Generated ${namespace.name} in ${tock - tick} ms`)
    })
  } else console.warn(`[webnwb]: Unable to be generate API from file specification.`)


      // Ensure All Objects Inherit from Each Other
      for (let key in this._nameToSchema) {
        this._inherit(key)
    }

    schemas.forEach((name: string) => {
      this._getClasses(this[name])
    })

    // Flatten Schemas
    const arr = ['base', 'file']
    arr.forEach((schema:string) => {
        for (let clsName in this[schema]){
            this[clsName] = this[schema][clsName]
            delete this[schema][clsName]
        }
        delete this[schema]
    })
})

  }
}

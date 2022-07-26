import { ArbitraryObject, AttributeType, GroupType, LinkType, DatasetType } from './types/general.types';
import schemas from './schema'
import * as caseUtils from './utils/case'

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
      
      const o = parentObject[key] ?? {}
      const inheritedName = o.inherits?.value

      if (inheritedName){
      const inheritedPath = this._nameToSchema[inheritedName]?.path

      let inherit:ArbitraryObject | undefined;
      if (inheritedPath){
        inherit = this
        inheritedPath.forEach((str:string) => {
            inherit = inherit?.[str] 
        })
        inherit = inherit?.[inheritedName]
    }
    
      if (inherit) {
        if (inherit.inherits) {
          this._inherit(inheritedName) // Finish inheritance for parent first
        }

        // Defer inheritance for groups (i.e. create handlers instead)
        if (o.inherits?.type !== 'group') {
          const deep = JSON.parse(JSON.stringify(inherit))
          parentObject[key] = Object.assign(deep, o)
          delete parentObject[key].inherits // delete at the end
        }

      } else if (o.inherits) console.log(`[webnwb]: Cannot inherit ${inheritedName}`, o, namespace, schema, key)

    }
      // Drill Into Objects
      if (typeof parentObject[key] === 'object') for (let k in parentObject[key]) {
          this._inherit(k, parentObject[key])
      }
    }
  }

  _baseName = (str: string) => {
    return str.replace('nwb', '')
  }


  _generateHelperFunctions = (base:string | string[], valueToDrill?: any) => {

    let str = ''

    if (base){
      if (!Array.isArray(base)) base = [base]
      str += base.map((str, i) => {
      let caps = caseUtils.set(str, 'pascal')
      let camel = caseUtils.set((str.slice(0,3) === 'NWB' ? 'nwb' + str.slice(3) : str)) // ensure NWB is fully lowercase

      return `

          Object.defineProperties(this, {
            add${caps}: {
              value: function add${caps}(obj) {
                this.${camel}[obj.name] = obj
              }, 
              enumerable: false,
              writable: false
            },
            get${caps}: {
              value: function get${caps}(name) {
                return this.${camel}[name]
              }, 
              enumerable: false,
              writable: false
            }
          });

          if (!this.${camel}) this.${camel} = {};
        `
      }).join('\n')
    }

    if (valueToDrill) {
      for (let key in valueToDrill) {
        const newVal = valueToDrill[key]
        if (newVal && typeof newVal === 'object'){ 

          // Create helpers for the base objects
          if (newVal._base){
            delete valueToDrill[key]._base
            str += this._generateHelperFunctions(key, newVal)
          } 
          
          // Create helpers for nested groups
          else if (newVal.inherits && newVal.inherits.value && newVal.inherits.type === 'group') {
            str += this._generateHelperFunctions(key)
            delete valueToDrill[key].inherits
          }
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

        let helperFunctions: string = ''
        const mapped = keys.map((k:string) => {
          

          const val = schema[clsName][k]
          let str = ''

          // Is base directly
          if (k === '_base') {
            helperFunctions = this._generateHelperFunctions(val)
            delete schema[clsName][k]
          } 
          
          // Drill Deeper
          else {


            if (val && typeof val === 'object' && val._base) {
              delete val._base
              str += `${this._generateHelperFunctions(k, val)};\n`
            } else str += `${this._generateHelperFunctions(undefined, val)};\n`

            str += `this.${k} = ${JSON.stringify(val)}` // add base object
          }
          
          return str
        })

        const fnString =  `return function ${clsName}(o={}){
          ${mapped.join('\n')}
          Object.assign(this, o);
          ${helperFunctions}
        }`

          const generatedClass = new Function(fnString)();
          schema[clsName] = generatedClass
        }
    }

  }
  

  _setFromObject = (o: any, aggregator: ArbitraryObject = {}, type?:string, path:string[] = []) => {


    const camelCaseDepth = 2
    const isDeep = (path.length >= camelCaseDepth)
    const isGroup = type === 'group'
    let name = (o.neurodata_type_def ?? o.data_type_def) ?? o.name ?? o.default_name
    let inherit = {
      type,
      value: (o.neurodata_type_inc ?? o.data_type_inc)
    } 

    const nameType = (isDeep) ? 'camel' : 'pascal'
    name = caseUtils.set(name, nameType)

    const newPath = [...path]

    if (name) {
          const value = o.value ?? o.default_value ?? (isDeep && !isGroup) ? null : {}
          if (aggregator[name] instanceof Function) aggregator[name].prototype[name] = inherit
          else aggregator[name] = value
          newPath.push(name)
    }

    // Assign default name (not always working...)
    if (o.default_name) {
      aggregator[name].name = o.default_name
    }


    if (inherit.value) {

      // Specify inherited class
      if (aggregator[name]){
        if (aggregator[name] instanceof Function) aggregator[name].prototype.inherits = inherit
        else aggregator[name].inherits = inherit
      } 

      // Assign group helper functions
      if (type === 'group') {
        const base = this._baseName(inherit.value)
        if (!aggregator._base) aggregator._base = [base] // generate helpers on class instance
        else aggregator._base.push(base)
      }
    }


    // Attributes
    if (o.attributes) {
      const thisAggregator = aggregator[name] ?? aggregator
      o.attributes.forEach((attr: AttributeType) => {
        this._setFromObject(attr, thisAggregator, 'attribute', newPath)
      })
    }

    // Groups
    if (o.groups) {
      const thisAggregator = aggregator[name] ?? aggregator
      o.groups.forEach((group: GroupType) => {
        this._setFromObject(group, thisAggregator, 'group', newPath)
      })    
    }

    // Links
    if (o.links) {
      o.links.forEach((link: LinkType) => {
        this._setFromObject(link, aggregator[name] ?? aggregator, 'link', newPath)
      })
    }

    // Datasets
    if (o.datasets) {
      o.datasets.forEach((dataset: DatasetType) => {
        this._setFromObject(dataset, aggregator[name] ?? aggregator, 'dataset', newPath)
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

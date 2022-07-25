import { ArbitraryObject, AttributeType, GroupType, LinkType, DatasetType } from './types/general.types';
import schemas from './schema'
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

  _set = (name:string, key:string, value:any) => {
    const path = this._nameToSchema[name]?.path
    if (path){
      let target = this
      path.forEach((str:string) => target = target[str] ?? target)
      target[key] = value
    }
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

      const inheritedName = o.inherits

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

  _getClasses(schema:ArbitraryObject){
    for (let clsName in schema) {

        // Construct Class (attributes in function)
        const keys = Object.keys(schema[clsName])

        // NOTES
        // 1. Iterate through the keys (still no transition of default_name)
      
          const generatedClass = new Function(
              `return function ${clsName}(o={}){
                  ${keys.map(k => {
                    const val = schema[clsName][k]
                    console.log('val', k, val, schema[clsName])
                    return `this.${k} = ${(typeof val === 'function' ? val.toString() : JSON.stringify(val))}`
                  }).join(';')}
                  Object.assign(this, o)
                }`
          )();

          schema[clsName] = generatedClass
    }

  }
  

  _setFromObject(o: any, aggregator: ArbitraryObject = {}, type?:string) {

    const name = (o.neurodata_type_def ?? o.data_type_def) ?? o.name ?? o.default_name
    const inherit = (o.neurodata_type_inc ?? o.data_type_inc)

    if (name) {

          const value = o.value ?? o.default_value ?? {}
          if (aggregator[name] instanceof Function) aggregator[name].prototype[name] = inherit
          else {
            aggregator[name] = value
          }
    }


    if (inherit) {

      // Specify inherited class
      if (aggregator[name]){
        if (aggregator[name] instanceof Function) aggregator[name].prototype.inherits = inherit
        else aggregator[name].inherits = inherit 
      } 

      // Assign group helper functions
      if (type === 'group') {

        let map = new Map()
        const get = (name:string) => {
          return map.get(name)
        }
        
        const add = (obj:any) => {
          map.set(obj.name, obj)
        }

        const create = (input:ArbitraryObject) => {
          const obj = new this[inherit](input)
          add(obj)
        }

        const noNWB = inherit.replace('NWB', '')
        let transformedName = `${noNWB[0].toLowerCase()}${noNWB.slice(1)}` 

        // check whether the name needs to become plural
        const needsS = transformedName.slice(-1) !== 's' && transformedName.slice(-4) != 'Data'
        if (needsS) transformedName += 's'

        // add helpers
        aggregator[transformedName] = map
        aggregator[`add${noNWB}`] = add
        aggregator[`create${noNWB}`] = create
        aggregator[`get${noNWB}`] = get

        if (o.default_name) aggregator.name = o.default_name // track default name

    }


    }


    // Attributes
    if (o.attributes) {
      o.attributes.forEach((attr: AttributeType) => {
        this._setFromObject(attr, aggregator[name] ?? aggregator)
      })
    }

    // Groups
    if (o.groups) {
      const aggregation = aggregator[name] ?? aggregator
      o.groups.forEach((group: GroupType) => {
        this._setFromObject(group, aggregation, 'group')
      })
    }

    // Links
    if (o.links) {
      o.links.forEach((link: LinkType) => {
        this._setFromObject(link, aggregator[name] ?? aggregator)
      })
    }

    // Datasets
    if (o.datasets) {
      o.datasets.forEach((dataset: DatasetType) => {
        this._setFromObject(dataset, aggregator[name] ?? aggregator)
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
            
            base[name] = this._setFromObject(info)

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

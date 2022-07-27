import { ArbitraryObject, AttributeType, GroupType, LinkType, DatasetType } from '../types/general.types';
import * as caseUtils from '../utils/case'
import { OptionsType } from './types';
import * as test from "./utils/test"
import * as rename from "./utils/rename"
import Classify from './classify';

type SpecificationType = { [x: OptionsType['coreName']]: ArbitraryObject } & ArbitraryObject

// Generate an API from included specification
export default class API {

  _registry: SpecificationType
  _specification: SpecificationType = {}

  _options: OptionsType; 
  _nameToSchema: ArbitraryObject = {};
  extensions: ArbitraryObject = {};
  _version?: string;
  _classify: Classify

  [x: string]: any;

  constructor(
    specification: SpecificationType, // Fallback to latest schema or empty specification
    options:Partial<OptionsType> = {}
  ) {

    // copy options
    this._options = options as OptionsType
    if (!this._options.name) this._options.name = 'apify'
    if (!this._options.allCaps) this._options.allCaps = []
    if (!this._options.namespacesToFlatten) this._options.namespacesToFlatten = []
    if (!this._options.patternsToRemove) this._options.patternsToRemove = []
    if (!this._options.overrides) this._options.overrides = {}
    if (typeof this._options.getValue !== 'function') this._options.getValue = () => undefined // triggert default


    this._classify = new Classify()

    // copy user-specified specification
    this._registry = JSON.parse(JSON.stringify(specification)) // Deep copy

    const globalTarget = (globalThis as any)
    // assign latest API to global (for create calls...)
    if (!globalTarget.apify) globalTarget.apify = {}
    globalTarget.apify[this._options.name] = this
  }


  _inherit = (key: string, parentObject?: ArbitraryObject) => {

    const schema = this._nameToSchema[key]
    const namespace = schema?.namespace


    if (!parentObject) {
      schema.path.forEach((str: string) => {
        parentObject = this[str]
      })
    }

    if (parentObject) {

      const o = parentObject[key] ?? {}
      let name = o.inherits?.value
      if (Array.isArray(name)) {
        name.forEach(str => this._inherit(str))
      } else {

        if (name) {
          const inheritedPath = this._nameToSchema[name]?.path

          let inherit: ArbitraryObject | undefined;
          if (inheritedPath) {
            inherit = this
            inheritedPath.forEach((str: string) => {
              inherit = inherit?.[str]
            })
            inherit = inherit?.[name]
          }

          if (inherit) {
            if (inherit.inherits || inherit.inherits?.done) this._inherit(name) // Finish inheritance for parent first

            // // Object Inheritance for Non-Groups
              const deep = JSON.parse(JSON.stringify(inherit))

              Object.assign(parentObject[key], Object.assign(deep, o)) // reassign to reference
              o.inherits.done = true // has inherited

            
            // Defered inheritance for groups. Create handlers instead
            if (o.inherits?.type === 'group') {
              // if (o.class === false) delete o[key]

              // keep inherit value
              Object.defineProperty(parentObject[key], 'inherits', {
                value: o.inherits,
                enumerable: false,
                writable: false,
              })

            }

          } else if (o.inherits) console.log(`[${this._options.name}]: Cannot inherit ${name}`, o, namespace, schema, key)

        }
        // Drill Into Objects
        if (typeof parentObject[key] === 'object') for (let k in parentObject[key]) this._inherit(k, parentObject[key])
      }
    }
  }

  _conformToSpec = (name:string, info:any) => {
    const spec = this._get(name, this._specification[this._options.coreName])
    console.log('got spec', spec)
    const newInfo = caseUtils.setAll(info) // transform to camelCase
    console.log('newInfo', newInfo)
    return newInfo
  }

  // Set schema item
  _set = (name:string, value:any, key?:string) => {
    const path = this._nameToSchema[name]?.path
    if (path){
      let target = this
      if (!key) key = path.pop() // define last key
      path.forEach((str:string) => target = target[str] ?? target)
      target[key as string] = value
    } else return null
  }

    // Get schema item
  _get = (name:string, target=this) => {
    const path = this._nameToSchema[name]?.path

    if (path){
      path.forEach((str:string) => target = target[str] ?? target)
      return target[name]
    } else return null
  }


  _getType = (o: any) => o.neurodata_type_inc ?? o.data_type_inc 

  _setFromObject = (o: any, aggregator: ArbitraryObject = {}, type?: string, path: string[] = []) => {

    const isGroup = type === 'group'
    const isDataset = type === 'dataset'

    let name = this._options.methodName.reduce((acc:any, str:string) => acc = (!acc) ? o[str] : acc, null)    
    if (!name) name = this._getType(o) // NAME FOR GROUP (???): name can be specified as a single string for the inheritance value (allows inheritance on top-level classes with groups)
    let isClass = (name) ? test.isClass(name) : true

    // check groups one level down
    let inherit = {
      type,
      value: this._getType(o) ?? ((o.groups) ? o.groups.map((g: any) => this._getType(g)).filter((v:any) => !!v) : null)
    }

    // Use camelcase for non-classes
    if (!isClass) {
      const camelCase = caseUtils.set(rename.base(name, this._options.allCaps))
      name = camelCase
    }


    const newPath = [...path]

    if (name) {

      // TODO: Arbitrary define default value marker
      const value = this._options.getValue(o) ?? ((!isDataset && (!isClass && !isGroup)) ? undefined : {})
      if (aggregator[name] instanceof Function) aggregator[name].prototype[name] = inherit
      else aggregator[name] = value

    }

    // Assign default name
    if (o.default_name) aggregator[name].name = o.default_name


    if (inherit.value) {

      // Specify inherited class
      if (aggregator[name]) {
        if (aggregator[name] instanceof Function) {
          Object.defineProperty(aggregator[name].prototype.inherits, 'inherits', {
            value: inherit,
            enumerable: false,
            writable: false
          })
        } else {
          Object.defineProperty(aggregator[name], 'inherits', {
            value: inherit,
            enumerable: false,
            writable: false
          })
        }
      }
    }


    // Carry group type to the final classes
    if (isGroup) {
      if (aggregator[name]) {

          Object.defineProperty(aggregator[name], 'type', {
            value: isClass ? 'class' : 'group',
            enumerable: false,
            writable: true
          })

          if (!isClass && aggregator.type === 'group') aggregator.type = '' // remove type for outer group
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

  _generate(spec: any = this._registry, key?: string) {


    if (!this._options.coreName) {
      this._options.coreName = 'core'
      spec = {core: spec} // nest core in a root specification
    }

    let keys = (key) ? [key] : Object.keys(spec)
    keys.forEach((key: any) => {


      const o = JSON.parse(JSON.stringify(spec[key])) // Deep Copy Spec

      const isFormatted = !!o.namespace
      const version = (!o.namespace) ? Object.values(o)[0] : o // File OR Specification Format

      // Account for File vs Schema Specification Formats
      const namespaceInfo = version?.namespace // File OR Specification Format
      const namespace = (typeof namespaceInfo === 'string') ? JSON.parse(namespaceInfo) : namespaceInfo
      if (namespace) {
        namespace.namespaces.forEach((namespace: any) => {

          const scopedSpec: ArbitraryObject = {}
          const tick = performance.now()
          if (namespace.name !== this._options.coreName && this._options.debug) console.log(`[${this._options.name}]: Loading ${namespace.name} extension.`)

          namespace.schema.forEach((schema: any) => {

            // Grabbing Schema
            if (schema.source) {

              // Differentiate Non-Core Elements
              const extension = namespace.name !== this._options.coreName
              if (extension && !this.extensions[namespace.name]) this.extensions[namespace.name] = {}

              // Set Schema Information
              const name = this._options.patternsToRemove.reduce((a:string, b:string) => a = a.replace(b, ''), schema.source)

              const base = (extension) ? this.extensions[namespace.name] : this

              // Don't Overwrite Redundant Namespaces / Schemas

              if (!base[name]) {

                base[name] = {}

                // Account for File vs Schema Specification Formats
                const schemaInfo = version[schema.source] ?? version[name]
                const info = (typeof schemaInfo === 'string') ? JSON.parse(schemaInfo) : schemaInfo

                base[name] = this._setFromObject(info, undefined, undefined, [name])

                // Track Object Namespaces and Paths
                for (let key in base[name]) this._nameToSchema[key] = (extension) ? { namespace: namespace.name, path: ['extensions', namespace.name, name] } : { namespace: namespace.name, path: [name] }
                scopedSpec[name] = base[name]
              }
            }
          })

          // Generate Specification Registry
          if (isFormatted) delete this._registry[key] // Delete Pre-Formatted Specs
          this._registry[namespace.name] = {}
          this._registry[namespace.name][namespace.version] = scopedSpec

          const tock = performance.now() // show Performance
          if (this._options.debug) console.log(`[${this._options.name}]: Generated ${namespace.name} in ${tock - tick} ms`)

          // setting version
          if (namespace.name === this._options.coreName) this._version = namespace.version

        })
      } else console.warn(`[${this._options.name}]: Unable to be generate API from file specification.`)
    })

    // ------------------ AFTER GENERATING ALL SCHEMAS ------------------
    // Set classify information
    this._classify.set(Object.assign({
      version: this._version as string,
    }, this._options))

    // Ensure All Objects Inherit from Each Other
    for (let key in this._nameToSchema) this._inherit(key)

    // Separate specification from the class registry
    this._specification = this._registry

    // Populate the class registry
    for (let spec in this._registry) {
      for (let version in this._registry[spec]){
      const schema = this._registry[spec][version]
      for (let namespace in schema) {

        const namespaceRef = schema[namespace]
        this._specification[spec][version][namespace] = Object.assign({}, namespaceRef) // Shallow copy of the current specification information
        this._classify.replace(namespaceRef) // get classes for namespace (apply to reference)
      }
      }
    }
    

    // Flatten Certain Schema Classes
    const arr = this._options.namespacesToFlatten
    arr.forEach((schema: string) => {
      for (let clsName in this[schema]) this[clsName] = this[schema][clsName]
    })

  }
}

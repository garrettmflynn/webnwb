import { ArbitraryObject, AttributeType, GroupType, LinkType, DatasetType } from '../types/general.types';
import * as caseUtils from '../utils/case'
import { OptionsType } from './types';
import * as test from "./utils/test"
import * as rename from "./utils/rename"
import Classify from './classify';
import InheritanceTree from './classify/InheritanceTree';
import { isNativeClass } from './utils/classes';
import { propertyReactionRegistrySymbol } from './utils/globals';

type SpecificationType = { [x: OptionsType['coreName']]: ArbitraryObject } & ArbitraryObject

// Generate an API from included specification
export default class API {

  _registry: SpecificationType
  _specification: SpecificationType = {}

  _options: OptionsType; 
  _nameToSchema: ArbitraryObject = {};
  extensions: ArbitraryObject = {};
  _version?: string;
  _classify: Classify;
  _inheritanceTree = new InheritanceTree();

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
    this._classify.baseClass = this._options.baseClass

    // copy user-specified specification
    this._registry = JSON.parse(JSON.stringify(specification)) // Deep copy
    
    const globalTarget = (globalThis as any)
    // assign latest API to global (for create calls...)
    if (!globalTarget.apify) globalTarget.apify = {}
    globalTarget.apify[this._options.name] = this
  }

  _define = (name:string, target:any, format:any) => {
    Object.defineProperty(target, name, format)
  }

  // Set schema item
  set = (name:string, value:any, key?:string) => {
    const path = this._nameToSchema[name]?.path
    if (path){
      let target = this
      if (!key) key = path.pop() // define last key
      path.forEach((str:string) => target = target[str] ?? target)
      target[key as string] = value
      return true
    } else return null
  }

  // Get schema item (constructor function)
  get = (name:string, objectShape?: any, target=this._registry): null | Function => {

    const key = this._options.classKey
    if (key && objectShape && key in objectShape)  name = objectShape[key] ?? name

    const path = this._nameToSchema[name]?.path
    if (path){
      path.forEach((str:string) => target = target[str] ?? target)
      return target[name]
    } else return (objectShape) ? this.getMatchingClass(objectShape) : null
  }

  getMatchingClass = (input: any) => this.get(this._classify.match(input)) 

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


    const newPath = name ? [...path, name] : path

    if (name) {

      // const value = this._options.getValue(undefined, o) ?? ((!isDataset && (!isClass && !isGroup)) ? undefined : (isGroup) ? {} : {})
      const value = o.value ?? o.default_value ?? ((isClass || isGroup) ? {} : undefined)

      // console.log('Getting value', newPath, value, o, aggregator.type)

      if (typeof aggregator[name] === 'function') {
        const isClass = isNativeClass(aggregator[name])
        if (isClass) aggregator[name].prototype[name] = inherit
      }
      else if (aggregator.type === 'dataset') Object.defineProperty(aggregator, name, { value }) // Setting additional information on the dataset
      else {

        aggregator[name] = value // Set aggregator value

        if (!(propertyReactionRegistrySymbol in aggregator)) Object.defineProperty(aggregator, propertyReactionRegistrySymbol, {value: { values: {}, reactions: {}  }})

        // Ensure that object properties will react to values that are set
        if (!isClass){
          const id = Symbol('property registry value id')
          const options = this._options
          Object.defineProperty(aggregator[propertyReactionRegistrySymbol].reactions, name, {
            get: function () { 
              return this[propertyReactionRegistrySymbol]?.values?.[id] 
            },
            set: function (v: any){

              // Ensure that the registry is defined
              if (!(propertyReactionRegistrySymbol in this)) Object.defineProperty(this, propertyReactionRegistrySymbol, {value: { values: {}, reactions: {}  }})

                // Set new current value
                let current = this[propertyReactionRegistrySymbol].values[id] = options.getValue(v, o) // Always get an object
                
                // Add metadata
                if (current && typeof current === 'object') {
                  for (let key in o) Object.defineProperty(current, key, { value: o[key], enumerable: false })
                }
            },
            configurable: true
          })
        }

      }
    }



    // Assign default name
    if (o.default_name) aggregator[name].name = o.default_name

    if (inherit.value) {

      if (name && inherit.type){
        this._inheritanceTree.add(inherit.value, name, isClass ? 'classes' : 'groups')
      }
    }


    // Carry group type to the final classes
    // if (value && typeof value === 'object' && hasObject) {    

      // Setting type
      const entry = aggregator[name]
      if (entry && typeof entry === 'object'){
        const resolvedType = isClass ? 'class' : type
        Object.defineProperty(entry, 'type', {
          value: resolvedType,
          enumerable: false, // NOTE: This would be better hidden—but then it doesn't carry over...
          writable: true,
          configurable: true
        })

        // Handle nested groups
        if (aggregator.type === 'group') {
          if (isClass) delete aggregator[name] // Delete classes on group level
          else aggregator.type = '' // remove type for outer group
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
      const version = (!o.namespace) ? o[Object.keys(o)[0]] : o // File OR Specification Format

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

                const path = [namespace.name, namespace.version, name]

                // Track Object Namespaces and Paths
                for (let key in base[name]) this._nameToSchema[key] = { namespace: namespace.name, path }
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
    this._classify.set(Object.assign({ version: this._version as string }, this._options))


    // Decouple specification (while maintaining non-enumerable properties)
    this._specification = JSON.parse(JSON.stringify(this._registry))
      for (let spec in this._registry) {
        for (let version in this._registry[spec]){
        const schema = this._registry[spec][version]
        for (let namespace in schema) {
          this._specification[spec][version][namespace] = Object.assign({}, schema[namespace]) // Shallow copy of the current specification information
        }
        }
      }
    
    // Populate the class registry
    this._classify.load(this._registry, {
      tree: this._inheritanceTree,
      type: 'classes'
    }, false) // get classes for namespace (apply to reference)
    

    // Flatten Certain Schema Classes
    const arr = this._options.namespacesToFlatten
    arr.forEach((schema: string) => {
      for (let clsName in this[schema]) this[clsName] = this[schema][clsName]
    })

  }
}

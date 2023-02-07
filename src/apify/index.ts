import { ArbitraryObject, AttributeType, GroupType, LinkType, DatasetType } from '../types/general.types';
import * as caseUtils from '../utils/case'
import { OptionsType } from './types';
import * as test from "./utils/test"
import * as rename from "./utils/rename"
import Classify from './classify';
import InheritanceTree from './classify/InheritanceTree';
import { isNativeClass } from './utils/classes';
import { hasNestedGroups, isClassType } from './utils/globals';

// import { 
//   // objectify, 
//   isGroup as isGroupType, 
//   isDataset as isDatasetType 
// } from '../../../hdf5-io/src';

import { 
  // objectify, 
  isGroup as isGroupType, 
  isDataset as isDatasetType 
 } from 'hdf5-io/dist/index.esm';

// import { objectify } from '../../../esmodel/src/presets';
import * as conform from 'esconform/dist/index.esm'

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

      // Class
      if (typeof aggregator[name] === 'function') {
        const isClass = isNativeClass(aggregator[name])
        if (isClass) aggregator[name].prototype[name] = inherit
      }

              
      // Is a class on a group
      else if (isClass && aggregator[isGroupType]) {
        delete aggregator[name] // Delete classes on group level
      }
      
      // Group
      else if (isGroup) {
        const value = aggregator[name] = {} as any// Set aggregator value
        if (!isClass) {
          Object.defineProperty(value, isGroupType, { value: true })
          if (aggregator[isGroupType] && !aggregator[hasNestedGroups]) Object.defineProperty(aggregator, hasNestedGroups, { value: true })
        }
      }      

      // Nested classes
      else if (isClass) aggregator[name] = {}
      
      // Dataset
      else {
        let value = o.value ?? o.default_value // Create a null object
        const objectValue = value = conform.presets.objectify(name, value)
        // if (objectValue) {
          Object.defineProperty(objectValue, isDatasetType, { value: true }) // Setting type on the dataset
        // } else if (recognizeUndefinedError === false) {
        //   console.error('Get this to recognize undefined...')
        //   recognizeUndefinedError = true
        // }

        Object.defineProperty(aggregator, name, {value: objectValue, enumerable: true})

      } 

      const value = aggregator?.[name]
      if (isClass && value) Object.defineProperty(value, isClassType, { value: true }) // Distinguish classes

      // Add to inheritance tree
      if (inherit.value && inherit.type) this._inheritanceTree.add(inherit.value, name, isClass ? 'classes' : 'groups')

    }

      const aggregated = (name) ? aggregator[name] : aggregator

    // Set properties
      const set = (o: any, type:string) => this._setFromObject(o, aggregated, type, newPath)

      const keys = Object.keys(o)
      keys.forEach(key => {
          if (key === 'attributes')  o.attributes.forEach((attr: AttributeType) => set(attr, 'attribute'))
          else if (key === 'groups') o.groups.forEach((group: GroupType) => set(group, 'group'))
          else if (key === 'links') o.links.forEach((link: LinkType) => set(link, 'link'))
          else if (key === 'datasets') o.datasets.forEach((dataset: DatasetType) => set(dataset, 'dataset'))
          if (aggregated) Object.defineProperty(aggregated, key, { value: o[key] })

      })

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
              const label = this._options.getNamespaceLabel ? this._options.getNamespaceLabel(schema.source) : schema.source

              const base = (extension) ? this.extensions[namespace.name] : this

              // Don't Overwrite Redundant Namespaces / Schemas

              if (!base[label]) {

                base[label] = {}

                // Account for File vs Schema Specification Formats
                const name = this._options.getNamespaceKey ? this._options.getNamespaceKey(schema.source) : schema.source
                const schemaInfo = version[name]
                const info = (typeof schemaInfo === 'string') ? JSON.parse(schemaInfo) : schemaInfo

                base[label] = this._setFromObject(info, undefined, undefined, [label])

                const path = [namespace.name, namespace.version, label]

                // Track Object Namespaces and Paths
                for (let key in base[label]) this._nameToSchema[key] = { namespace: namespace.name, path }
                scopedSpec[label] = base[label]
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

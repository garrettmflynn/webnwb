import { ArbitraryObject, AttributeType, GroupType, LinkType, DatasetType } from '../types/general.types';
import * as caseUtils from '../utils/case'
import drill from '../utils/drill';

type OptionsType = {
    debug?: boolean,
    name: string,
    coreName: string,
    methodName: string[],
    allCaps: string[],
    namespacesToFlatten: string[],
    patternsToRemove: string[],
    overrides: {
      [x: string]: {
        [x: string]: (self: any) => any
      }
    },
    getValue: (o: any) => any
}

type SpecificationType = { [x: OptionsType['coreName']]: ArbitraryObject } & ArbitraryObject

// Generate an API from included specification
export default class API {

  _specification: SpecificationType
  _options: OptionsType;
  _nameToSchema: ArbitraryObject = {};
  extensions: ArbitraryObject = {};
  _version?: string;

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

    // copy user-specified specification
    this._specification = JSON.parse(JSON.stringify(specification)) // Deep copy

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

  _baseName = (str: string) => {
    this._options.allCaps.forEach(s => {
        str = str.replaceAll(s, s.toLowerCase())
    })
    return str
  }


  _generateHelperFunctions = (base?: string, valueToDrill?: any, path:string[]=[], aliases:string | string[] = []) => {

    let str = ``

    if (base) {
        let pascal = caseUtils.set(base, 'pascal')
        let camel = caseUtils.set(this._baseName(base)) // ensure special all-caps strings are fully lowercase
        const thisString = `this.${path.slice(1).join('.')}`

        if (aliases && !Array.isArray(aliases)) aliases = [aliases]
        const names = new Set(aliases)
        names.add(pascal)

        const randId = Math.floor(100000*Math.random())

        // Add helper on base. Add empty object at path
        return `

        const methods${randId} = ${JSON.stringify(Array.from(names))}
        methods${randId}.forEach(method => {
        if (!this._deleted) {
          Object.defineProperty(this, '_deleted', {
            value: [],
            enumerable: false,
            writable: false,
          })
        }

        if (!${thisString}) ${thisString} = {};

        const addName = 'add' + method
        const getName = 'get' + method
        const createName = 'create' + method

        if (!this._deleted.includes(method)){
          try {
            Object.defineProperties(this, {
              [addName]: {
                value: function add${pascal}(obj) {
                  this.${camel}[obj.name] = obj
                }, 
                enumerable: false,
                writable: false
              },
              [getName]: {
                value: function get${pascal}(name) {
                  return this.${camel}[name]
                }, 
                enumerable: false,
                writable: false
              },
              [createName]: {
                value: function create${pascal}(o) {
                  let cls;
                  methods${randId}.forEach(method => {
                    if (!cls) cls = globalThis.apify.${this._options.name}._get(method)
                  })
                  if (cls) {
                    const created = new cls(o)
                    return this.add${pascal}(created)
                  } else {
                    console.error('[${this._options.name}]: Could not find class for ${pascal}');
                    return null
                  }
                }, 
                enumerable: false,
                writable: false
              }
            });
          } catch (e) {
            const aliases = ${JSON.stringify(aliases)}
            console.warn('[${this._options.name}]: Trying to redeclare a helper function for ${pascal}', 'removing aliases: ' + aliases)
            aliases.forEach(alias => {
              delete this[alias]
              this._deleted.push(alias)
            })
          };
        }
        })

        `    
      }

    if (valueToDrill) {
      for (let key in valueToDrill) {
        let newVal = valueToDrill[key]

        if (newVal && typeof newVal === 'object') {

          const nestedGroup = newVal.inherits && newVal.inherits.value

          // Create helpers for nested groups (those which kept their non-enumerable values) and their children (except for deep classes)
          if (nestedGroup) {

            this._options.allCaps.forEach(str => key = key.replace(str, ''))

            // update / remove class key
            if (path.length === 1) {
              let newKey = caseUtils.set(key)
              if (newKey != key) {
                valueToDrill[newKey] = valueToDrill[key] // transfer
                delete valueToDrill[key] // delete

                // reassign
                key = newKey
                newVal = valueToDrill[key]
              }
            }

            if (!this._isClass(key)) str += this._generateHelperFunctions(key, newVal, [...path, key], newVal?.inherits?.value)
          }
        }
      }
    }

    return str


  }

  _isClass = (str: string) => {
    return caseUtils.get(str) === 'pascal' // Assume pascal case
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
  _get = (name:string) => {
    const path = this._nameToSchema[name]?.path

    if (path){
      let target = this
      path.forEach((str:string) => target = target[str] ?? target)
      return target[name]
    } else return null
  }

  _getClasses(schema: ArbitraryObject) {

    // internal check functions
    const typeCheck = (o:any) => o && !!o.type // check if has type
    const objectCheck = (o:any) => o && typeof o === 'object' // check if object

    // scrub objects with a class type on them...
    const scrub = (o:any) => {

      if (o && typeof o === 'object') {

        const scrubbed = Object.assign({}, o)
        for (let key in scrubbed) {
          const val = scrubbed[key]
          if (val){
            if (val.type === 'class') delete scrubbed[key]
            else scrub(scrubbed[key])
          }
        }


        return scrubbed
      } else return o
    }

    for (let clsName in schema) {

      if (typeof schema[clsName] === 'object') {

        // Get all helper functions
        let helperFunctions = this._generateHelperFunctions(undefined, schema[clsName], [clsName])

        // Map keys to attributes
        const keys = Object.keys(schema[clsName])
        const mapped = keys.map((k: string) => {
          let val = schema[clsName][k]
          val = scrub(val) // will remove internal groups
          return `this.${k} = ${JSON.stringify(val)}` // setting base object
        })


        // declare a type on the object if specified
        const declareType = drill(schema[clsName], {
          run: typeCheck,
          drill: objectCheck
        }, (o: any, path: string[], acc: string) => {
          const joined = path.join('.')

          if (o.type !== 'class'){
            acc += `Object.defineProperty(this${joined ? `.${joined}` : ''}, "type", {
              value: "${o.type}",
              enumerable: false,
              writable: false
            });\n`
          }

          return acc
        }, '')

        let overrides = ``
        for (let key in this._options.overrides[clsName]) {
          if (keys.includes(key)) overrides += `this.${key} = ${JSON.stringify(this._options.overrides[clsName][key](this))}\n` // keep overrides in schema
          else console.warn(`[${this._options.name}]: ${key} (override) is out of schema for ${clsName}`)
        }
        
        const inputArg = `o`

        // force input to schema (but always allow name)
        const handleInputString = `
          const arr = Object.keys(${inputArg})
          console.log('arr', arr)
          arr.forEach(key => {
            const val = ${inputArg}[key]
            if (key === 'name') this[key] = val
            else if (key in this){
              console.log(key, this[key])
              if (this[key] && typeof this[key] === 'object' && this[key].type === 'group') {

                const camelKey = key[0].toUpperCase() + key.slice(1);

                for (let name in val){
                  const instance = val[name]
                  console.log(key, name, instance)
                  this['create' + camelKey](instance); // create class from raw object
                }
              } else this[key] = val // assign raw attribute
            } else console.warn('[${this._options.name}]: ' + key + ' (argument) is out of schema for ${clsName}')
          })
        `

        const fnString = `return function ${clsName}(${inputArg}={}){
          ${mapped.join('\n')}
          ${declareType}
          ${helperFunctions}
          ${handleInputString}
          ${overrides}
        }`

        const generatedClass = new Function(fnString)();
        schema[clsName] = generatedClass
      }
    }

  }


  _getType = (o: any) => o.neurodata_type_inc ?? o.data_type_inc 

  _setFromObject = (o: any, aggregator: ArbitraryObject = {}, type?: string, path: string[] = []) => {

    const isGroup = type === 'group'
    const isDataset = type === 'dataset'

    let name = this._options.methodName.reduce((acc:any, str:string) => acc = (!acc) ? o[str] : acc, null)    
    if (!name) name = this._getType(o) // NAME FOR GROUP (???): name can be specified as a single string for the inheritance value (allows inheritance on top-level classes with groups)
    let isClass = (name) ? this._isClass(name) : true

    // check groups one level down
    let inherit = {
      type,
      value: this._getType(o) ?? ((o.groups) ? o.groups.map((g: any) => this._getType(g)).filter((v:any) => !!v) : null)
    }

    // Use camelcase for non-classes
    if (!isClass) {
      const camelCase = caseUtils.set(this._baseName(name))
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

  _generate(spec: any = this._specification, key?: string) {


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
          if (isFormatted) delete this._specification[key] // Delete Pre-Formatted Specs
          this._specification[namespace.name] = {}
          this._specification[namespace.name][namespace.version] = scopedSpec

          const tock = performance.now() // show Performance
          if (this._options.debug) console.log(`[${this._options.name}]: Generated ${namespace.name} in ${tock - tick} ms`)

          // setting version
          if (namespace.name === this._options.coreName) this._version = namespace.version

        })
      } else console.warn(`[${this._options.name}]: Unable to be generate API from file specification.`)
    })

    // AFTER GENERATING ALL SCHEMAS
    // Ensure All Objects Inherit from Each Other
    for (let key in this._nameToSchema) this._inherit(key)

    const core = this._specification.core
    for (let key in core) {
      const subschema = core[key]
      for (let clsName in subschema) this._getClasses(subschema[clsName]) // get classes for core
    }

    // Flatten Certain Schema Classes
    const arr = this._options.namespacesToFlatten
    arr.forEach((schema: string) => {
      for (let clsName in this[schema]) this[clsName] = this[schema][clsName]
    })

  }
}

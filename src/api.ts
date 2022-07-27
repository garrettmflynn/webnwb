import { ArbitraryObject } from './types/general.types';
import schemas from './schema'
import API from './apify';

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
      debug,
      name: 'webnwb',
      methodName: ['neurodata_type_def',  'data_type_def', 'name', 'default_name' ],
      allCaps: ['NWB'],
      coreName: 'core',
      namespacesToFlatten: ['base', 'file'],
      patternsToRemove: ['nwb.', '.extensions', '.yaml'],
      getValue: (o) => o.value ?? o.default_value,
      overrides: {
        NWBFile: {
          nwbVersion: (api) => api._version
        }
      }
    })

    this._generate()

  }
}

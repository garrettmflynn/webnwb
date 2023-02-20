import { ArbitraryObject, OptionsType } from "../types"

// NOTE: Must be bound to resolve this value
export function getPropertyName(this: ArbitraryObject, name: string, options: Partial<OptionsType>) {

    const instance = this
    const overrides = options?.overrides
    if (overrides && typeof overrides === 'object') {
      let override = overrides?.[name] as any
      if (override == undefined || typeof override === 'object') {
        const namespace = overrides[instance.name]
        override = (namespace && typeof namespace === 'object') ?  namespace[name] : namespace
      }
      if (override !== undefined) name = override
    }
  
  
    if (name.slice(-1)[0] === 's' && options.singularName) return options.singularName[name] ?? name
    
    return name
  }
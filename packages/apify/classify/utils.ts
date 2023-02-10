import { OptionsType } from "../types"

// NOTE: Must be bound to resolve this value
export function getPropertyName(name: string, options: Partial<OptionsType>) {
    const aliases = options?.aliases
    if (aliases && typeof aliases === 'object') {
      let override = aliases?.[name] as any
      if (!override || typeof override === 'object') {
        const namespace = aliases[this.name]
        override = (namespace && typeof namespace === 'object') ?  namespace[name] : namespace
      }
      if (override) name = override
    }
  
  
    if (name.slice(-1)[0] === 's' && options.singularName) return options.singularName[name] ?? name
    
    return name
  }
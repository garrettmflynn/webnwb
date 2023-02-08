import { OptionsType } from "../types"

// NOTE: Must be bound to resolve this value
export function getPropertyName(name: string, options: Partial<OptionsType>) {
    const overrides = options?.overrides
    if (overrides && typeof overrides === 'object') {
      let override = overrides?.[name] as any
      if (!override || typeof override === 'object') {
        const namespace = overrides[this.name]
        override = (namespace && typeof namespace === 'object') ?  namespace[name] : namespace
      }
      if (override) name = override
    }
  
  
    if (name.slice(-1)[0] === 's' && options.singularName) return options.singularName[name] ?? name
    
    return name
  }

  export function setProperty (name:string, value: PropertyDescriptor, options?: OptionsType) {
    if (options) name = getPropertyName.call(this,name, options)
    return Object.defineProperty(this, name, value)
  }
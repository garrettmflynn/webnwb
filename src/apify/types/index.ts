import ApifyBaseClass from "../classify/base"

export type OverrideType = string | ((info: any) => any) // Rename with string OR replce with different function
export type NamespaceOverride = {
  [x: string]: OverrideType // Rename with string OR replce with different function
}

export type OptionsType = {
    debug?: boolean,
    name: string,
    coreName: string,
    methodName: string[],
    allCaps: string[],
    namespacesToFlatten: string[],
    
    getNamespaceKey: (str: string) => string,
    getNamespaceLabel: (str: string) => string,

    singularName: {[x:string]: string}

    classKey?: string,

    baseClass?: ApifyBaseClass // Add functionality to the base class

    // Override properties on a generated class instance
    overrides: {
      [x: string]: NamespaceOverride | OverrideType
    },
    getValue: (key: string | symbol | number, value: any, o: any) => any
}

export type InfoType = OptionsType & {
    version: string
}

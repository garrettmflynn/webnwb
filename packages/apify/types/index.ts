import ApifyBaseClass from "../classify/base"

export type OverrideType = string | ((info: any) => any) // Rename with string OR replce with different function
export type NamespaceOverride = {
  [x: string]: OverrideType // Rename with string OR replce with different function
}

export type OptionsType = {
    debug?: boolean,
    name: string,
    coreName: string,
    getNamespaceKey: (str: string) => string,
    getNamespaceLabel: (str: string) => string,

    className: string[],
    propertyName: string[],
    inheritsFrom: string[],

    singularName: {[x:string]: string}

    // inheritKey?: string,
    classKey?: string,
    specClassKey?: string,

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

export type ArbitraryObject = {[x:string | symbol]: any}
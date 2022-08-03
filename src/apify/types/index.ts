import ApifyBaseClass from "../classify/base"

export type OptionsType = {
    debug?: boolean,
    name: string,
    coreName: string,
    methodName: string[],
    allCaps: string[],
    namespacesToFlatten: string[],
    patternsToRemove: string[],

    baseClass?: ApifyBaseClass // Add functionality to the base class

    // Override properties on a generated class instance
    overrides: {
      [x: string]: {
        [x: string]: (info: any) => any
      }
    },
    getValue: (o: any) => any
}

export type InfoType = OptionsType & {
    version: string
}

export type OptionsType = {
    debug?: boolean,
    name: string,
    coreName: string,
    methodName: string[],
    allCaps: string[],
    namespacesToFlatten: string[],
    patternsToRemove: string[],
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

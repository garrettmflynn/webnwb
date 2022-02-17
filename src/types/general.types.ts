export type FileMethods = "w" | "r" | "r+" | "a" | "w-" | "x"
export type dtype = "text" | "numeric" | "float32" | string

export type AttributeType = {
    default_value?: any
    value?: any
    doc: string
    dtype: dtype
    name: string
    required: boolean
}

export type DatasetType = {
    doc: string // Explanation
    dtype: dtype // Expected type of values
    name: string // Name of the dataset object
    attributes?: any[]
    dims?: any[][]
    shape?: any[][]
    quantity?: string
    neurodata_type_inc?: string // Inherited object
    data_type_inc?: string // Inherited object
}

export type ArbitraryObject = {[x:string]: any}

export type LinkType = {
    doc: string
    name: string
    target_type: string
}

export type GroupType = {
    doc: string // Explanation
    neurodata_type_def: string // Base object
    data_type_def: string // Base object
    neurodata_type_inc: string // Inherited object
    data_type_inc: string // Inherited object
    quantity: string // Amount?
}
export type InstanceType = 'main' | 'staging'

export type Options = {
 version?: string
 type?: InstanceType,
 token?: string
}

export type AssetsRequestConfig = {
    dandiset: string, 
    options: Options
}
  
export type AssetRequestConfig = AssetsRequestConfig & { id: string }
  
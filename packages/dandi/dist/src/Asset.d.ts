import { InstanceType, Options } from "./types";
declare type AssetBase = {
    asset_id: string;
    blob: string;
    created: string;
    modified: string;
    path: string;
    size: number;
    zarr: string | null;
};
export declare class Asset {
    #private;
    asset_id?: AssetBase['asset_id'];
    blob?: AssetBase['blob'];
    created?: AssetBase['created'];
    modified?: AssetBase['modified'];
    path?: AssetBase['path'];
    size?: AssetBase['size'];
    zarr?: AssetBase['zarr'];
    constructor(dandiset: string, info: string | AssetBase, instance?: InstanceType);
    get(dandiset?: string, id?: string | undefined, instance?: InstanceType): Promise<Asset>;
    getInfo(options?: Options): Promise<any>;
}
export declare const getAsset: (dandiset: string, id: string, options?: Options | undefined) => Promise<Asset>;
export declare const getAssetInfo: (dandiset: string, id: string, options?: Options | undefined) => Promise<any>;
export default Asset;

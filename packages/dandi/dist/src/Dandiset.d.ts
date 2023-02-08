import { Asset } from "./Asset";
import { InstanceType, Options } from "./types";
declare type DandisetVersionInfo = {
    asset_count: number;
    created: string;
    modified: string;
    name: string;
    size: number;
    status: string;
    version: string | 'draft';
};
declare type DandisetBase = {
    identifier: string;
    contact_person: string;
    created: string;
    embargo_status: string;
    modified: string;
    draft_version: DandisetVersionInfo;
    most_recent_published_version: DandisetVersionInfo;
};
export declare class Dandiset {
    #private;
    identifier?: DandisetBase['identifier'];
    contact_person?: DandisetBase['contact_person'];
    created?: DandisetBase['created'];
    embargo_status?: DandisetBase['embargo_status'];
    modified?: DandisetBase['modified'];
    draft_version?: DandisetBase['draft_version'];
    most_recent_published_version?: DandisetBase['most_recent_published_version'];
    constructor(info: DandisetBase | DandisetBase['identifier'] | undefined, instance?: InstanceType);
    get(id?: string | undefined): Promise<any>;
    getInfo(options?: Options): Promise<any>;
    getAsset(id: string): Promise<any>;
    getAssets(options?: Options): Promise<any>;
}
export declare const getAssetsUrl: (dandiset: string, options?: Options | undefined) => string;
export declare const getAssets: (id: string, options?: Options | undefined) => Promise<Asset[] | undefined>;
export declare const getAll: (instance?: Options['instance']) => Promise<Dandiset[]>;
export declare const get: (id: string, instance?: InstanceType | undefined) => Promise<Dandiset | null>;
export {};

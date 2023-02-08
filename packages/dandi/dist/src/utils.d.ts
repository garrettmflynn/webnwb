import { InstanceType, Options } from "./types";
export declare const getLatestVersion: (id: string, instance?: InstanceType | undefined) => Promise<any>;
export declare const getInstance: (instance?: InstanceType | undefined) => string;
export declare const getJSON: (url: string) => Promise<any>;
export declare const getBase: (id: string, instance?: InstanceType | undefined) => Promise<any>;
export declare const getInfoURL: (id: string, options?: Options | undefined) => string;
export declare const getInfo: (id: string, options?: Options | undefined) => Promise<any>;
export declare const paginate: (o: any) => Promise<any[]>;

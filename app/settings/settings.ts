export interface SyncTarget {
    address: string;
    username: string;
    password: string;
}


export interface Settings {
    remoteSites: Array<string>;
    syncTarget: SyncTarget;
    username: string;
    dbs: Array<string>;
}
const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;


export interface SyncTarget {

    address: string;
    password: string;
}


export interface Settings {

    languages: string[];
    isAutoUpdateActive: boolean;
    isSyncActive: boolean;
    remoteSites: Array<string>;
    hostPassword: string;
    syncTarget: SyncTarget;
    username: string;
    dbs: Array<string>;
    imagestorePath: string;
}


export module Settings {

    export function getLocale(): string {

        return remote.getGlobal('getLocale')();
    }
}

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


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
    selectedProject: string;
    imagestorePath: string;
}


export module Settings {

    export function getLocale(): string {

        return remote
            ? remote.getGlobal('getLocale')()
            : 'de'; // Return default locale if remote is not accessible (in unit tests)
    }
}

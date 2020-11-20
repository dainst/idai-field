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

    // TODO get rid of this. instead let getSettings return a version of settings where selectedProject is set.
    export function getSelectedProject(settings: Settings): string {

        return settings.dbs && settings.dbs.length > 0
            ? settings.dbs[0]
            : 'test';
    }


    export function getLocale(): string {

        return remote
            ? remote.getGlobal('getLocale')()
            : 'de'; // Return default locale if remote is not accessible (in unit tests)
    }
}

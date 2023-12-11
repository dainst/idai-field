import { FileSyncPreference, I18N } from 'idai-field-core';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


export interface SyncTarget {

    address: string;
    password: string;
    isSyncActive: boolean;
    fileSyncPreferences: FileSyncPreference[];
}


export interface Settings {

    languages: string[];
    isAutoUpdateActive: boolean;
    hostPassword: string;
    syncTargets: { [projectIdentifier: string]: SyncTarget };
    username: string;
    dbs: string[];
    projectNames?: { [projectIdentifier: string]: I18N.String };
    selectedProject: string;
    imagestorePath: string;
    hideHiddenFieldsInConfigurationEditor?: boolean;
    highlightCustomElements?: boolean;
    allowLargeFileUploads?: boolean;
}


export module Settings {

    export function getLocale(): string {

        return remote
            ? remote.getGlobal('getLocale')()
            : 'de'; // Return default locale if remote is not accessible (in unit tests)
    }

    
    export function hasUsername(settings: Settings): boolean {

        return settings.username !== undefined
            && settings.username !== 'anonymous';
    }
}

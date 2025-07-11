import { I18N } from 'idai-field-core';
import { SyncTarget } from './sync-target';
import { KeepBackupsSettings } from './keep-backups-settings';

const remote = window.require('@electron/remote');


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
    backupDirectoryPath: string;
    hideHiddenFieldsInConfigurationEditor?: boolean;
    highlightCustomElements?: boolean;
    allowLargeFileUploads?: boolean;
    keepBackups: KeepBackupsSettings;
}


export module Settings {

    export function getLocale(): string {

        return remote
            ? remote.getGlobal('getLocale')()
            : 'de'; // Return default locale if remote is not accessible (in unit tests)
    }

    
    export function hasUsername(settings: Settings): boolean {

        return isUsername(settings.username);
    }


    export function isUsername(username: string): boolean {

        return username
            && username.trim().length > 0
            && username !== 'anonymous';
    }


    export function getSyncTarget(settings: Settings): SyncTarget {

        return settings.syncTargets ? settings.syncTargets[settings.selectedProject] : undefined;
    }


    export function isSynchronizationActive(settings: Settings): boolean {

        const syncTarget: SyncTarget = Settings.getSyncTarget(settings);
        return syncTarget?.isSyncActive;
    }
}

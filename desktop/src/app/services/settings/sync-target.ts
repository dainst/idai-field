import { FileSyncPreference } from 'idai-field-core';


export interface SyncTarget {

    address: string;
    password: string;
    isSyncActive: boolean;
    fileSyncPreferences: FileSyncPreference[];
}

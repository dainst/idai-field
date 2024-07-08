import { FileSyncPreference } from 'idai-field-core';

const address = globalThis.require('address');


export interface SyncTarget {

    address: string;
    password: string;
    isSyncActive: boolean;
    fileSyncPreferences: Array<FileSyncPreference>;
}


export module SyncTarget {

    export function getAddress(syncTarget: SyncTarget) {

        if (!syncTarget) return undefined;

        // Prevent trying to synchronize with own database
        return syncTarget.address.trim().replace('http://', '').replace(':3000', '') === address.ip()
            ? '.'
            : syncTarget.address;
    }
}

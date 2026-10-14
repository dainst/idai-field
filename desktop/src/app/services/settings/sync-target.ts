import { FileSyncPreference } from 'idai-field-core';
import { getIpAddress } from '../get-ip-address';


export interface SyncTarget {

    address: string;
    password: string;
    isSyncActive: boolean;
    startSequence?: string|number;  // Only used for the first synchronization after downloading a project database
    fileSyncPreferences: Array<FileSyncPreference>;
}


export module SyncTarget {

    export async function getAddress(syncTarget: SyncTarget) {

        if (!syncTarget) return undefined;

        // Prevent trying to synchronize with own database
        return syncTarget.address.trim().replace('http://', '').replace(':3000', '') === await getIpAddress()
            ? '.'
            : syncTarget.address;
    }
}

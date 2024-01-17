export enum SyncStatus {

    Offline = 'OFFLINE',
    Connecting = 'CONNECTING',
    Pushing = 'PUSHING',
    Pulling = 'PULLING',
    InSync = 'IN_SYNC',
    Error = 'ERROR',
    AuthenticationError = 'AUTHENTICATION_ERROR',
    AuthorizationError = 'AUTHORIZATION_ERROR'
}


export module SyncStatus {

    export function isSyncing(status: SyncStatus): boolean {

        return status === SyncStatus.Connecting
            || status === SyncStatus.Pushing
            || status === SyncStatus.Pulling;
    }
}

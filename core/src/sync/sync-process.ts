import { Observable } from 'rxjs';


export interface SyncProcess {

    url: string;
    cancel(): void;
    observer: Observable<SyncStatus>;
}


export enum SyncStatus {

    Offline = 'OFFLINE',
    Pushing = 'PUSHING',
    Pulling = 'PULLING',
    InSync = 'IN_SYNC',
    Error = 'ERROR',
    AuthenticationError = 'AUTHENTICATION_ERROR',
    AuthorizationError = 'AUTHORIZATION_ERROR'
}


export namespace SyncStatus {

    export const getFromInfo = (info: any) =>
    info.direction === 'push' ? SyncStatus.Pushing : SyncStatus.Pulling;


    export const getFromError = (err: any) =>
        err.status === 401
            ? err.reason === 'Name or password is incorrect.'
                ? SyncStatus.AuthenticationError
                : SyncStatus.AuthorizationError
            : SyncStatus.Error;
}

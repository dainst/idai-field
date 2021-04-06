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

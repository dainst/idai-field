import {Observable} from 'rxjs';

export interface SyncProcess {

    url: string;
    cancel(): void;
    observe: Observable<any>;
}

export enum SyncStatus {
    Offline = "OFFLINE",
    Pushing = "PUSHING",
    Pulling = "PULLING",
    InSync = "IN_SYNC",
    Error = "ERROR",
    AuthenticationError = "AUTHENTICATION_ERROR",
    AuthorizationError = "AUTHORIZATION_ERROR"
}
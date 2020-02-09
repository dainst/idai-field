import {Observable} from 'rxjs';

export interface SyncProcess {

    url: string;
    cancel(): void;
    observe: Observable<any>;
}

export enum SyncStatus {
    Offline = "OFFLINE",
    Unknown = "UNKNOWN",
    Pushing = "PUSHING",
    Pulling = "PULLING",
    InSync = "IN_SYNC",
    InError = "IN_ERROR"
}
import {Observable} from "rxjs/Observable";

export interface SyncState {

    url: string;

    cancel(): void;

    onError: Observable<any>;

    onPaused: Observable<any>;

    onActive: Observable<any>;

}
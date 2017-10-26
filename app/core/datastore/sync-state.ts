import {Observable} from "rxjs/Observable";

export interface SyncState {

    url: string;

    cancel(): void;

    onError: Observable<any>;

    onChange: Observable<any>;

}
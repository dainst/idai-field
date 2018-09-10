import {Observable} from "rxjs";

export interface SyncState {

    url: string;

    cancel(): void;

    onError: Observable<any>;

    onChange: Observable<any>;

}
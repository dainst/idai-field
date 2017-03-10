import {Observable} from "rxjs/Observable";
import {Imagestore} from './imagestore';
import {DomSanitizer} from "@angular/platform-browser";

export abstract class AbstractImagestore implements Imagestore {
	public sani: DomSanitizer = undefined;

	public abstract read(key: string): Promise<ArrayBuffer>;

	public abstract create(key: string, data: ArrayBuffer): Promise<any>;

    public abstract update(key: string, data: ArrayBuffer): Promise<any>;

    public abstract remove(key: string): Promise<any>;

    public objectChangesNotifications(): Observable<File> {
        return Observable.create( () => {});
    }
}
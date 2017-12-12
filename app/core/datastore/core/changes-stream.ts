import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {Document} from 'idai-components-2/core';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {TypeConverter} from './type-converter';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ChangesStream {

    private autoCacheUpdate: boolean = true;
    private observers: Array<Observer<Document>> = [];

    constructor(
        protected datastore: PouchdbDatastore,
        protected documentCache: DocumentCache<Document>,
        protected typeConverter: TypeConverter) {

        datastore.remoteChangesNotifications().subscribe(document => {

            if (!this.autoCacheUpdate) return;
            if (!document || !document.resource) return;

            const convertedDocument: Document = this.typeConverter.convert<Document>(document);

            // explicitly assign by value in order for changes to be detected by angular
            if (this.documentCache.get(convertedDocument.resource.id as string)) {
                this.documentCache.reassign(convertedDocument);
            }

            ChangesStream.removeClosedObservers(this.observers);
            this.observers.forEach(observer => observer.next(convertedDocument));
        });
    }


    public remoteChangesNotifications(): Observable<Document> {

        return new Observable<Document>((observer: Observer<Document>) => {
            this.observers.push(observer);
        });
    }


    public allChangesAndDeletionsNotifications(): Observable<void> {

        return this.datastore.allChangesAndDeletionsNotifications();
    }


    public setAutoCacheUpdate(autoCacheUpdate: boolean) {

        this.autoCacheUpdate = autoCacheUpdate;
    }


    private static removeClosedObservers(observers: Array<any>) {

        const observersToDelete: any[] = [];
        for (let i = 0; i < observers.length; i++) {
            if ((observers[i] as any).closed) observersToDelete.push(observers[i]);
        }
        for (let observerToDelete of observersToDelete) {
            let i = observers.indexOf(observerToDelete as never);
            observers.splice(i, 1);
        }
    }
}
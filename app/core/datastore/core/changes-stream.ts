import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {Document} from 'idai-components-2/core';
import {TypeConverter} from './type-converter';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {Injectable} from '@angular/core';


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
            if (!document || !document.resource ||
                !this.documentCache.get(document.resource.id as any)) return;

            // explicitly assign by value in order for changes to be detected by angular
            this.documentCache.reassign(
                this.typeConverter.convert<Document>(document));

            this.observers.forEach(observer => observer.next(document));
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
}
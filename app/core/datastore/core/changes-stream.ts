import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {Document} from 'idai-components-2/core';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {TypeConverter} from './type-converter';
import {IndexFacade} from "../index/index-facade";
import {ObserverUtil} from '../../../util/observer-util';


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
        protected indexFacade: IndexFacade,
        protected documentCache: DocumentCache<Document>,
        protected typeConverter: TypeConverter) {

        datastore.remoteChangesNotifications().subscribe(document => {
            if (!document || ! document.resource) return;
            this.welcomeRemoteDocument(document);
        });
        datastore.remoteDeletedNotifications().subscribe(document => {
            this.indexFacade.remove(document);
        });
    }


    public allChangesAndDeletionsNotifications = () => this.datastore.allChangesAndDeletionsNotifications();

    public remoteChangesNotifications = (): Observable<Document> => ObserverUtil.register(this.observers);

    public setAutoCacheUpdate = (autoCacheUpdate: boolean) => this.autoCacheUpdate = autoCacheUpdate;


    private welcomeRemoteDocument(document: Document) {

        this.indexFacade.put(document); // TODO put after the guards, it was moved here during a refactoring and we want to maintain the original order for now

        if (!this.autoCacheUpdate) return; // TODO put to constructor

        const convertedDocument = this.typeConverter.convert<Document>(document);

        // explicitly assign by value in order for changes to be detected by angular
        if (this.documentCache.get(convertedDocument.resource.id as string)) {
            this.documentCache.reassign(convertedDocument);
        }

        ObserverUtil.removeClosedObservers(this.observers);
        ObserverUtil.notify(this.observers, convertedDocument);
    }
}
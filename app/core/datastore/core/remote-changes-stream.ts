import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {Document} from 'idai-components-2/core';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {TypeConverter} from './type-converter';
import {IndexFacade} from '../index/index-facade';
import {ObserverUtil} from '../../../util/observer-util';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class RemoteChangesStream {

    private autoCacheUpdate: boolean = true;
    private observers: Array<Observer<Document>> = [];

    constructor(
        private datastore: PouchdbDatastore,
        private indexFacade: IndexFacade,
        private documentCache: DocumentCache<Document>,
        private typeConverter: TypeConverter<Document>) {

        datastore.remoteChangesNotifications().subscribe(document => {

            if (!document || ! document.resource) return;
            this.welcomeRemoteDocument(document);
        });
        datastore.remoteDeletedNotifications().subscribe(document => {
            this.indexFacade.remove(document); // TODO what about the deletions? shouldn't we also notify the observers?
        });
    }


    public notifications = (): Observable<Document> => ObserverUtil.register(this.observers);

    public setAutoCacheUpdate = (autoCacheUpdate: boolean) => this.autoCacheUpdate = autoCacheUpdate;


    private welcomeRemoteDocument(document: Document) {

        this.indexFacade.put(document); // TODO put after convert

        if (!this.autoCacheUpdate) return;

        const convertedDocument = this.typeConverter.convert(document);

        // explicitly assign by value in order for changes to be detected by angular
        if (this.documentCache.get(convertedDocument.resource.id)) {
            this.documentCache.reassign(convertedDocument);
        }

        ObserverUtil.notify(this.observers, convertedDocument);
    }
}
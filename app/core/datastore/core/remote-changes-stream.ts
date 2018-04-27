import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {Action, Document} from 'idai-components-2/core';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {TypeConverter} from './type-converter';
import {IndexFacade} from '../index/index-facade';
import {ObserverUtil} from '../../../util/observer-util';
import {SettingsService} from '../../settings/settings-service';


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
        private typeConverter: TypeConverter<Document>,
        private settingsService: SettingsService
    ) {

        datastore.remoteChangesNotifications().subscribe(async document => {

            if (!document || !document.resource) return;

            let conflictedRevisions: Document[] = [];
            try {
                conflictedRevisions = await datastore.fetchConflictedRevisions(document.resource.id);
            } catch (e) {
                console.warn('Failed to fetch conflicted revisions for document', document.resource.id);
            }

            if (RemoteChangesStream.isRemoteChange(
                    document,
                    conflictedRevisions,
                    this.settingsService.getUsername())) {

                this.welcomeRemoteDocument(document);
            }
        });
        datastore.remoteDeletedNotifications().subscribe(document => {
            this.indexFacade.remove(document); // TODO what about the deletions? shouldn't we also notify the observers?
        });
    }

    public notifications = (): Observable<Document> => ObserverUtil.register(this.observers);

    public setAutoCacheUpdate = (autoCacheUpdate: boolean) => this.autoCacheUpdate = autoCacheUpdate;


    private static isRemoteChange(
        document: Document,
        conflictedRevisions: Array<Document>,
        username: string): boolean {

        let latestAction: Action = Document.getLastModified(document);

        for (let revision of conflictedRevisions) {
            const latestRevisionAction: Action = Document.getLastModified(revision);
            if (latestRevisionAction.date > latestAction.date) {
                latestAction = latestRevisionAction;
            }
        }

        return latestAction && latestAction.user !== username;
    }


    private welcomeRemoteDocument(document: Document) {

        if (!this.autoCacheUpdate) return;

        const convertedDocument = this.typeConverter.convert(document);
        this.indexFacade.put(convertedDocument);

        // explicitly assign by value in order for changes to be detected by angular
        if (this.documentCache.get(convertedDocument.resource.id)) {
            this.documentCache.reassign(convertedDocument);
        }

        ObserverUtil.notify(this.observers, convertedDocument);
    }
}
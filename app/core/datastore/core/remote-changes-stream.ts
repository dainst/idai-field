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

        datastore.deletedNotifications().subscribe(document => {
            this.documentCache.remove(document.resource.id);
            this.indexFacade.remove(document);
        });


        datastore.changesNotifications().subscribe(async document => {

            let conflictedRevisions: Document[] = [];
            try {
                conflictedRevisions = await this.fetchConflictedRevisions(document.resource.id);
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
    }

    public notifications = (): Observable<Document> => ObserverUtil.register(this.observers);

    public setAutoCacheUpdate = (autoCacheUpdate: boolean) => this.autoCacheUpdate = autoCacheUpdate;


    private async fetchConflictedRevisions(resourceId: string): Promise<Array<Document>> {

        const conflictedRevisions: Array<Document> = [];

        const document = await this.datastore.fetch(resourceId);

        if ((document as any)['_conflicts']) {
            for (let revisionId of (document as any)['_conflicts']) {
                conflictedRevisions.push(await this.datastore.fetchRevision(document.resource.id, revisionId));
            }
        }

        return conflictedRevisions;
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
}
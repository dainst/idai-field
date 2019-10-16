import {Injectable} from '@angular/core';
import {asyncMap} from 'tsfun-extra';
import {Observable, Observer} from 'rxjs';
import {Action, Document, DatastoreErrors} from 'idai-components-2';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {TypeConverter} from './type-converter';
import {IndexFacade} from '../index/index-facade';
import {ObserverUtil} from '../../util/observer-util';
import {UsernameProvider} from '../../settings/username-provider';
import {DatastoreUtil} from './datastore-util';
import isConflicted = DatastoreUtil.isConflicted;
import isProjectDocument = DatastoreUtil.isProjectDocument;
import getConflicts = DatastoreUtil.getConflicts;
import {solveProjectDocumentConflicts} from './solve-project-document-conflicts';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ChangesStream {

    private observers: Array<Observer<Document>> = [];

    /**
     * For each incoming document, we wait a short and random amount of time
     * until we touch it. This is to minimize the chance that multiple clients
     * auto-resolve a conflict at the same time.
     */
    private documentsScheduledToWelcome: { [resourceId: string]: any } = {};


    constructor(
        private datastore: PouchdbDatastore,
        private indexFacade: IndexFacade,
        private documentCache: DocumentCache<Document>,
        private typeConverter: TypeConverter<Document>,
        private usernameProvider: UsernameProvider
    ) {


        datastore.deletedNotifications().subscribe(document => {

            this.documentCache.remove(document.resource.id);
            this.indexFacade.remove(document);
        });


        datastore.changesNotifications().subscribe(async document => {

            if (await ChangesStream.isRemoteChange(
                    document,
                    this.usernameProvider.getUsername())
                || isConflicted(document)) {

                if (this.documentsScheduledToWelcome[document.resource.id]) {
                    clearTimeout(this.documentsScheduledToWelcome[document.resource.id]);
                    delete this.documentsScheduledToWelcome[document.resource.id];
                }

                if (isProjectDocument(document) && isConflicted(document)) {

                    this.documentsScheduledToWelcome[document.resource.id] = setTimeout(
                        async () => {
                            const latestRevision = await this.datastore.fetch(document.resource.id);
                            const conflicts = getConflicts(latestRevision);

                            if (conflicts /* again, to make sure other client did not solve it in that exact instant */) {

                                const conflictedDocuments = await asyncMap(
                                    (resourceId: string) => {
                                        return this.datastore.fetchRevision(
                                            document.resource.id,
                                            resourceId)})(conflicts);

                                const currentAndOldRevisions = conflictedDocuments.concat(latestRevision);

                                const resolvedDocument = solveProjectDocumentConflicts(...currentAndOldRevisions);
                                await this.updateResolvedDocument(resolvedDocument);
                            }

                            await this.welcomeDocument(latestRevision);
                            delete this.documentsScheduledToWelcome[document.resource.id];
                        },
                        Math.random() * 10000);

                } else {
                    await this.welcomeDocument(document);
                }
            }
        });
    }

    public notifications = (): Observable<Document> => ObserverUtil.register(this.observers);


    private welcomeDocument(document: Document) {

        const convertedDocument = this.typeConverter.convert(document);
        this.indexFacade.put(convertedDocument);

        // explicitly assign by value in order for changes to be detected by angular
        if (this.documentCache.get(convertedDocument.resource.id)) {
            this.documentCache.reassign(convertedDocument);
        }

        ObserverUtil.notify(this.observers, convertedDocument);
    }


    private async updateResolvedDocument(document: Document) {

        try {

            await this.datastore.update(
                document,
                this.usernameProvider.getUsername(),
                getConflicts(document));

        } catch (errWithParams) {
            // If tho clients have auto-resolved the conflict are exactly the same time,
            // the document is already updated and its revisions already removed. Since
            // the revisions get updated before the document gets updated, REMOVE_REVISIONS
            // error tells us exactly that, which is why we can safely swallow it here.
            if (errWithParams[0] !== DatastoreErrors.REMOVE_REVISIONS_ERROR) throw errWithParams;
        }
    }


    private static async isRemoteChange(document: Document, username: string): Promise<boolean> {

        const latestAction: Action = Document.getLastModified(document);
        return latestAction && latestAction.user !== username;
    }
}
import {Injectable} from '@angular/core';
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


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class RemoteChangesStream {

    private observers: Array<Observer<Document>> = [];

    private documentScheduleMap: { [resourceId: string]: any } = {};

    private firstRound = true; // TODO take this out later

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

            if (await RemoteChangesStream.isRemoteChange(
                    document,
                    this.usernameProvider.getUsername())
                || isConflicted(document)) {

                if (this.documentScheduleMap[document.resource.id]) {
                    clearTimeout(this.documentScheduleMap[document.resource.id]);
                    delete this.documentScheduleMap[document.resource.id];
                }

                if (isProjectDocument(document) && isConflicted(document)) {

                    this.documentScheduleMap[document.resource.id] = setTimeout(
                        async () => {
                            const latestRevision = await this.datastore.fetch(document.resource.id);
                            await this.resolveProjectDocumentConflict(latestRevision);
                            await this.welcomeRemoteDocument(latestRevision);
                            delete this.documentScheduleMap[document.resource.id];
                        },
                        this.firstRound ? 1000 : Math.random() * 10000);

                    if (this.firstRound) this.firstRound = false;

                } else {
                    await this.welcomeRemoteDocument(document);
                }
            }
        });
    }

    public notifications = (): Observable<Document> => ObserverUtil.register(this.observers);


    private welcomeRemoteDocument(document: Document) {

        const convertedDocument = this.typeConverter.convert(document);
        this.indexFacade.put(convertedDocument);

        // explicitly assign by value in order for changes to be detected by angular
        if (this.documentCache.get(convertedDocument.resource.id)) {
            this.documentCache.reassign(convertedDocument);
        }

        ObserverUtil.notify(this.observers, convertedDocument);
    }


    private async resolveProjectDocumentConflict(document: Document) {

        console.warn('found conflicted project document', document);
        RemoteChangesStream.solve(document);

        try {

            await this.datastore.update(
                document,
                this.usernameProvider.getUsername(),
                getConflicts(document));

        } catch (errWithParams) {
            if (errWithParams[0] !== DatastoreErrors.REMOVE_REVISIONS_ERROR) throw errWithParams;
        }
    }


    private static solve(document: Document) { // TODO put to module

        (document.resource as any)['conflictedField'] = 0; // THIS IS TO MOCK A SUCCESSFUL MANUAL CONFLICT RESOLUTION
    }


    private static async isRemoteChange(document: Document, username: string): Promise<boolean> {

        const latestAction: Action = Document.getLastModified(document);
        return latestAction && latestAction.user !== username;
    }
}
import {Injectable} from '@angular/core';
import {Observable, Observer} from 'rxjs';
import {Action, Document} from 'idai-components-2';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {TypeConverter} from './type-converter';
import {IndexFacade} from '../index/index-facade';
import {ObserverUtil} from '../../util/observer-util';
import {UsernameProvider} from '../../settings/username-provider';
import {DatastoreUtil} from './datastore-util';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class RemoteChangesStream {

    private observers: Array<Observer<Document>> = [];


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
                    this.usernameProvider.getUsername())) {

                await this.welcomeRemoteDocument(document);
            }
        });
    }

    public notifications = (): Observable<Document> => ObserverUtil.register(this.observers);


    private async welcomeRemoteDocument(document: Document) {

        if (DatastoreUtil.isProjectDocument(document) && DatastoreUtil.isConflicted(document)) {
            await this.resolveProjectDocumentConflict(document);
        }

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
        (document.resource as any)['conflictedField'] = 0; // THIS IS TO MOCK A SUCCESSFUL MANUAL CONFLICT RESOLUTION

        await this.datastore.update(
            document,
            this.usernameProvider.getUsername(),
            DatastoreUtil.getConflicts(document))
    }


    private static async isRemoteChange(document: Document, username: string): Promise<boolean> {

        let latestAction: Action = Document.getLastModified(document);

        if (DatastoreUtil.isConflicted(document)) {
            // Always treat conflicted documents as coming from remote // TODO improve comment, describe what's going on
            return true;
        } else {
            return latestAction && latestAction.user !== username;
        }
    }
}
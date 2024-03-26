import { Observable, Observer } from 'rxjs';
import { IndexFacade } from '../../index/index-facade';
import { Action } from '../../model/action';
import { Document } from '../../model/document';
import { ObserverUtil } from '../../tools/observer-util';
import { DocumentConverter } from '../document-converter';
import { DocumentCache } from '../document-cache';
import { isProjectDocument } from '../helpers';
import { PouchdbDatastore } from '../pouchdb/pouchdb-datastore';
import { WarningsUpdater } from '../warnings-updater';
import { Datastore } from '../datastore';
import { ProjectConfiguration } from '../../services/project-configuration';
import { CategoryForm } from '../../model/configuration/category-form';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ChangesStream {

    private remoteChangesObservers: Array<Observer<Document>> = [];
    private remoteConfigurationChangesObservers: Array<Observer<void>> = [];
    private projectDocumentObservers: Array<Observer<Document>> = [];


    constructor(pouchDbDatastore: PouchdbDatastore,
                private datastore: Datastore,
                private indexFacade: IndexFacade,
                private documentCache: DocumentCache,
                private documentConverter: DocumentConverter,
                private projectConfiguration: ProjectConfiguration,
                private getUsername: () => string) {

        pouchDbDatastore.deletedNotifications().subscribe(document => {

            this.documentCache.remove(document.resource.id);
            this.indexFacade.remove(document);
        });

        pouchDbDatastore.changesNotifications().subscribe(async document => {

            if (isProjectDocument(document)) {
                await this.datastore.convert(document);
                ObserverUtil.notify(this.projectDocumentObservers, document);
            }

            const isRemoteChange: boolean = await ChangesStream.isRemoteChange(document, this.getUsername());

            if (isRemoteChange || !this.documentCache.get(document.resource.id)
                    || document._conflicts !== undefined) {
                await this.welcomeDocument(document);
            }

            if (isRemoteChange && document.resource.category === 'Configuration') {
                ObserverUtil.notify(this.remoteConfigurationChangesObservers, null);
            }
        });
    }


    public remoteChangesNotifications =
        (): Observable<Document> => ObserverUtil.register(this.remoteChangesObservers);

    public remoteConfigurationChangesNotifications =
        (): Observable<void> => ObserverUtil.register(this.remoteConfigurationChangesObservers);

    public projectDocumentNotifications =
        (): Observable<Document> => ObserverUtil.register(this.projectDocumentObservers);


    private async welcomeDocument(document: Document) {

        this.documentConverter.convert(document);
        WarningsUpdater.updateIndexIndependentWarnings(document, this.projectConfiguration);
        this.indexFacade.put(document);

        const previousVersion: Document|undefined = this.documentCache.get(document.resource.id);
        const previousIdentifier: string|undefined = previousVersion?.resource.identifier;
        await WarningsUpdater.updateIndexDependentWarnings(
            document, this.indexFacade, this.documentCache, this.projectConfiguration, this.datastore,
            previousIdentifier, true
        );

        if (previousVersion) {
            this.documentCache.reassign(document);
        } else {
            this.documentCache.set(document);
        }

        ObserverUtil.notify(this.remoteChangesObservers, document);
    }


    public static isRemoteChange(document: Document, username: string): boolean {

        const latestAction: Action = Document.getLastModified(document);
        return latestAction && latestAction.user !== username;
    }
}

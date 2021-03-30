import { Injectable } from '@angular/core';
import { DatastoreErrors, IndexFacade, isProjectDocument, ObserverUtil } from '@idai-field/core';
import { Action, Document } from 'idai-components-2';
import { Observable, Observer } from 'rxjs';
import { aMap } from 'tsfun';
import { ResourceId, RevisionId } from '../../constants';
import { SettingsProvider } from '../../settings/settings-provider';
import { CategoryConverter } from '../cached/category-converter';
import { DocumentCache } from '../cached/document-cache';
import { PouchdbDatastore } from '../pouchdb/pouchdb-datastore';
import { CAMPAIGNS, solveProjectDocumentConflict, STAFF } from './solve-project-document-conflicts';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ChangesStream {

    private remoteChangesObservers: Array<Observer<Document>> = [];
    private projectDocumentObservers: Array<Observer<Document>> = [];

    /**
     * For each incoming document, we wait a short and random amount of time
     * until we touch it. This is to minimize the chance that multiple clients
     * auto-resolve a conflict at the same time.
     */
    private documentsScheduledToWelcome: { [resourceId: string]: any } = {};


    constructor(private datastore: PouchdbDatastore,
                private indexFacade: IndexFacade,
                private documentCache: DocumentCache<Document>,
                private categoryConverter: CategoryConverter<Document>,
                private settingsProvider: SettingsProvider) {

        datastore.deletedNotifications().subscribe(document => {

            this.documentCache.remove(document.resource.id);
            this.indexFacade.remove(document);
        });

        datastore.changesNotifications().subscribe(async document => {

            if (isProjectDocument(document)) {
                ObserverUtil.notify(this.projectDocumentObservers, this.categoryConverter.convert(document));
            }

            if (await ChangesStream.isRemoteChange(
                    document,
                    this.settingsProvider.getSettings().username)
                || !this.documentCache.get(document.resource.id)
                || document._conflicts !== undefined) {

                if (this.documentsScheduledToWelcome[document.resource.id]) {
                    clearTimeout(this.documentsScheduledToWelcome[document.resource.id]);
                    delete this.documentsScheduledToWelcome[document.resource.id];
                }

                if (isProjectDocument(document) && document._conflicts !== undefined) {
                    this.documentsScheduledToWelcome[document.resource.id] = setTimeout(
                        () => this.onTimeout(document), Math.random() * 10000);
                } else {
                    await this.welcomeDocument(document);
                }
            }
        });
    }


    public remoteChangesNotifications =
        (): Observable<Document> => ObserverUtil.register(this.remoteChangesObservers);

    public projectDocumentNotifications =
        (): Observable<Document> => ObserverUtil.register(this.projectDocumentObservers);


    private async onTimeout(document: Document) {

        delete this.documentsScheduledToWelcome[document.resource.id];
        let solvedDocument: Document|undefined = undefined;
        try {
            console.log('Resolve project document conflict', JSON.stringify(document));
            solvedDocument = await this.resolveConflict(document);
        } catch (err) {
            console.error('Will not put document to index due to error in ChangesStream.resolveConflict', err);
            return;
        }
        await this.welcomeDocument(solvedDocument);
    }


    /**
     * Fetches the latestRevision of the document and tries to solve detected conflicts.
     * If at least one conflict has been solved, updates the document in the database.
     *
     * @param document
     *   - latestRevision if no conflicts were found or none resolved
     *   - the updated version of the document if at least one conflict has been solved
     */
    private async resolveConflict(document: Document): Promise<Document> {

        const latestRevision = await this.datastore.fetch(document.resource.id);
        if (!latestRevision.resource[STAFF]) latestRevision.resource[STAFF] = [];
        if (!latestRevision.resource[CAMPAIGNS]) latestRevision.resource[CAMPAIGNS] = [];

        const conflicts = latestRevision._conflicts;    // fetch again, to make sure it is up to date after the timeout
        if (!conflicts) return latestRevision;          // again, to make sure other client did not solve it in that exact instant

        const conflictedDocuments = await this.getConflictedDocuments(conflicts, document.resource.id);

        const solution = solveProjectDocumentConflict(latestRevision, conflictedDocuments);
        return ChangesStream.shouldUpdate(solution, latestRevision)
            ? this.updateResolvedDocument(solution)
            : latestRevision;
    }


    private async getConflictedDocuments(conflicts: Array<RevisionId>, resourceId: ResourceId) {

        return await aMap(revisionId => {
            return this.datastore.fetchRevision(resourceId, revisionId);
        }, conflicts);
    }


    private async welcomeDocument(document: Document) {

        const convertedDocument = this.categoryConverter.convert(document);
        this.indexFacade.put(convertedDocument);

        // explicitly assign by value in order for changes to be detected by angular
        if (this.documentCache.get(convertedDocument.resource.id)) {
            this.documentCache.reassign(convertedDocument);
        }

        ObserverUtil.notify(this.remoteChangesObservers, convertedDocument);
    }


    private async updateResolvedDocument([document, conflicts]: [Document, Array<RevisionId>]): Promise<Document> {

        try {
            return await this.datastore.update(
                document,
                this.settingsProvider.getSettings().username,
                conflicts
            );
        } catch (errWithParams) {
            // If tho clients have auto-resolved the conflict are exactly the same time,
            // the document is already updated and its revisions already removed. Since
            // the revisions get updated before the document gets updated, REMOVE_REVISIONS
            // error tells us exactly that, which is why we can safely swallow it here.
            if (errWithParams[0] !== DatastoreErrors.REMOVE_REVISIONS_ERROR) throw errWithParams;
            return await this.datastore.fetch(document.resource.id);
        }
    }


    private static async isRemoteChange(document: Document, username: string): Promise<boolean> {

        const latestAction: Action = Document.getLastModified(document);
        return latestAction && latestAction.user !== username;
    }


    private static shouldUpdate([documentAfterConflictResolution, squashRevisionIds]: [Document, Array<RevisionId>], latestRevisionDocument: Document) {

        const resolvedDocumentStaff = documentAfterConflictResolution.resource[STAFF] || [];
        const latestRevisionStaff = latestRevisionDocument.resource[STAFF] || [];

        const resolvedDocumentCampaigns = documentAfterConflictResolution.resource[CAMPAIGNS] || [];
        const latestRevisionCampaigns = latestRevisionDocument.resource[CAMPAIGNS] || [];

        return squashRevisionIds.length > 0
            // compare for length instead of equality, because we want to avoid loops where one machine reduces a length and then updates while another does the opposite
            || resolvedDocumentStaff.length > latestRevisionStaff.length
            || resolvedDocumentCampaigns.length > latestRevisionCampaigns.length;
    }
}

import {Observable} from 'rxjs/Observable';
import {DatastoreErrors, Document, NewDocument} from 'idai-components-2/core';
import {IdGenerator} from './id-generator';
import {ObserverUtil} from '../../../util/observer-util';
import {PouchdbProxy} from './pouchdb-proxy';
import {ChangeHistoryMerge} from './change-history-merge';
import {ObjectUtil} from '../../../util/object-util';

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PouchdbDatastore {

    public ready = () => this.db.ready();

    private changesObservers = [];
    private deletedObservers = [];

    // There is an issue where docs pop up in }).on('change',
    // despite them beeing deleted in remove before. When they
    // pop up in 'change', they do not have the deleted property.
    // So in order to identify them as to remove from the indices
    // they are marked 'manually'.
    private deletedOnes = [];


    constructor(
        private db: PouchdbProxy,
        private idGenerator: IdGenerator,
        setupChangesEmitterAndServer = true
        ) {

        if (setupChangesEmitterAndServer) {
            this.setupServer().then(() => this.setupChangesEmitter());
        }
    }

    public changesNotifications = (): Observable<Document> => ObserverUtil.register(this.changesObservers);

    public deletedNotifications = (): Observable<Document> => ObserverUtil.register(this.deletedObservers);


    /**
     * @returns newest revision of the document fetched from db
     * @throws [INVALID_DOCUMENT] - in case either the document given as param or
     *   the document fetched directly after db.put is not valid
     */
    public async create(document: NewDocument, username: string): Promise<Document> {

        const clonedDocument = ObjectUtil.cloneObject(document);

        if (!Document.isValid(clonedDocument as Document, true)) throw [DatastoreErrors.INVALID_DOCUMENT];

        let exists = false;
        if (clonedDocument.resource.id) try {
            await this.db.get(clonedDocument.resource.id);
            exists = true;
        } catch (_) {}
        if (exists) throw [DatastoreErrors.DOCUMENT_RESOURCE_ID_EXISTS];

        if (!clonedDocument.resource.id) clonedDocument.resource.id = this.idGenerator.generateId();
        (clonedDocument as any)['_id'] = clonedDocument.resource.id;
        (clonedDocument as any)['created'] = { user: username, date: new Date() };
        (clonedDocument as any)['modified'] = [];

        try {
            return await this.performPut(clonedDocument);
        } catch (err) {
            throw [DatastoreErrors.GENERIC_ERROR, err];
        }
    }


    /**
     * @returns newest revision of the document fetched from db
     * @throws [INVALID_DOCUMENT] - in case either the document given as param or
     *   the document fetched directly after db.put is not valid
     */
    public async update(
        document: Document,
        username: string,
        squashRevisionsIds?: string[])
    : Promise<Document> {

        if (!document.resource.id) throw [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID];
        if (!Document.isValid(document)) throw [DatastoreErrors.INVALID_DOCUMENT];
        try {
            await this.db.get(document.resource.id);
        } catch (e) {
            throw [DatastoreErrors.DOCUMENT_NOT_FOUND];
        }

        const resetFun = this.resetDocOnErr(document);
        (document as any)['_id'] = document.resource.id;

        if (squashRevisionsIds) this.mergeModifiedDates(document, squashRevisionsIds);
        document.modified.push({ user: username, date: new Date() });

        try {
            if (squashRevisionsIds) await this.removeRevisions(document.resource.id, squashRevisionsIds); // TODO put before try
            return await this.performPut(document);
        } catch (err) {
            resetFun(document);
            throw err.name && err.name == 'conflict'
                ? [DatastoreErrors.SAVE_CONFLICT]
                : [DatastoreErrors.GENERIC_ERROR, err];
        }
    }


    /**
     * @throws [DOCUMENT_NOT_FOUND]
     */
    public async remove(doc: Document): Promise<void> {

        if (!doc.resource.id) throw [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID];

        this.deletedOnes.push(doc.resource.id as never);

        let docFromGet;
        try {
            docFromGet = await this.db.get(doc.resource.id);
        } catch (e) {
            throw [DatastoreErrors.DOCUMENT_NOT_FOUND];
        }
        try {
            await this.db.remove(docFromGet)
        } catch (genericerror) {
            throw [DatastoreErrors.GENERIC_ERROR, genericerror];
        }
    }


    /**
     * @throws [DOCUMENT_NOT_FOUND]
     * @throws [INVALID_DOCUMENT]
     */
    public fetch(resourceId: string,
                 options: any = { conflicts: true }): Promise<Document> {
        // Beware that for this to work we need to make sure
        // the document _id/id and the resource.id are always the same.

        return this.db.get(resourceId, options)
            .then(
                (result: any) => {
                    if (!Document.isValid(result)) return Promise.reject([DatastoreErrors.INVALID_DOCUMENT]);
                    PouchdbDatastore.convertDates(result);
                    return Promise.resolve(result as Document);
                },
                (err: any) => Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND]))
    }


    /**
     * @throws [DOCUMENT_NOT_FOUND]
     * @throws [INVALID_DOCUMENT]
     */
    public fetchRevision(resourceId: string, revisionId: string): Promise<Document> { // TODO remove convenience method and call fetch directly

        return this.fetch(resourceId, { rev: revisionId });
    }


    protected async setupServer() {}


    private async performPut(document: any) {

        document['_rev'] = (await this.db.put(document, { force: true })).rev;
        return this.fetch(document.resource.id);
    }


    private resetDocOnErr(original: Document) {

        const created = JSON.parse(JSON.stringify(original.created)); // TODO make sure we have dates again
        const modified = JSON.parse(JSON.stringify(original.modified));

        const id = original.resource.id;
        return function(document: Document) {
            delete (document as any)['_id']; // TODO this one probably not, but maybe _ref and others ...
            document.resource.id = id;
            document.created = created;
            document.modified = modified;
        }
    }


    private async mergeModifiedDates(document: Document, squashRevisionsIds: string[]) {

        for (let revisionId of squashRevisionsIds) {
            ChangeHistoryMerge.mergeChangeHistories(
                document,
                await this.fetchRevision(document.resource.id, revisionId)
            );
        }
    }


    private async removeRevisions(resourceId: string|undefined, squashRevisionsIds: string[]): Promise<any> {

        if (!resourceId) return;

        try {
            for (let revisionId of squashRevisionsIds) await this.db.remove(resourceId, revisionId);
        } catch (err) {
            console.error("error while removing revision", err);
            throw [DatastoreErrors.GENERIC_ERROR, err];
        }
    }


    private setupChangesEmitter(): void {

        this.db.ready().then((db: any) => {

            db.changes({
                live: true,
                include_docs: false, // we do this and fetch it later because there is a possible leak, as reported in https://github.com/pouchdb/pouchdb/issues/6502
                conflicts: true,
                since: 'now'
            }).on('change', (change: any) => {
                // it is noteworthy that currently often after a deletion of a document we get a change that does not reflect deletion.
                // neither is change.deleted set nor is sure if the document already is deleted (meaning fetch still works)

                if (!change || !change.id) return;
                if (change.id.indexOf('_design') == 0) return; // starts with _design

                if (change.deleted || this.deletedOnes.indexOf(change.id as never) != -1) {
                    ObserverUtil.notify(this.deletedObservers, {resource: {id: change.id}} as Document);
                    return;
                }

                this.handleNonDeletionChange(change.id);

            }).on('complete', (info: any) => {
                // console.debug('changes stream was canceled', info);
            }).on('error', (err: any) => {
                console.error('changes stream errored', err);
            });
        });
    }


    private async handleNonDeletionChange(changeId: string): Promise<void> {

        let document: Document;
        try {
            document = await this.fetch(changeId);
        } catch (e) {
            console.warn('Document from remote change not found or not valid', changeId);
            throw e;
        }

        try { // TODO remove unnecessary try catch block
            ObserverUtil.notify(this.changesObservers, document);
        } catch (e) {
            console.error('Error while notifying observers');
        }
    }


    private static convertDates(result: any): Document {

        result.created.date = new Date(result.created.date);
        for (let modified of result.modified) modified.date = new Date(modified.date);
        return result;
    }
}

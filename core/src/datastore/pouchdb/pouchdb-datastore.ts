import { Observable } from 'rxjs';
import { ConfigurationDocument } from '../../model/document/configuration-document';
import { Document } from '../../model/document/document';
import { NewDocument } from '../../model/document/document';
import { ObserverUtil } from '../../tools';
import { DatastoreErrors } from '../datastore-errors';
import { ChangeHistoryMerge } from './change-history-merge';
import { IdGenerator } from './id-generator';
import { PouchDbFactory } from './types';


/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PouchdbDatastore {

    private db: PouchDB.Database;

    private changesObservers = [];
    private deletedObservers = [];

    // There is an issue where docs pop up in }).on('change',
    // despite them being deleted in remove before. When they
    // pop up in 'change', they do not have the deleted property.
    // So in order to identify them as to remove from the indices
    // they are marked 'manually'.
    private deletedOnes = [];


    constructor(private pouchDbFactory: PouchDbFactory,
                private idGenerator: IdGenerator) {}


    public getDb = (): PouchDB.Database => this.db;


    public destroyDb = (dbName: string) => this.pouchDbFactory(dbName).destroy();

    
    public async createEmptyDb(name: string, destroyExisting: boolean = false) {

        const db = this.pouchDbFactory(name);
        const info = await db.info();

        if (info.update_seq !== 0) {
            if (destroyExisting) {
                await db.destroy();
                return this.createEmptyDb(name);
            } else {
                throw 'DB not empty';
            }
        }
        return db;
    }


    public createDbForTesting(dbName: string) {
     
        this.db = this.pouchDbFactory(dbName);
        return this.db;
    }

    public setDb_e2e = (db: PouchDB.Database) => this.db = db;


    /**
     * Creates a new database. Unless specified specifically
     * with destroyBeforeCreate set to true,
     * a possible existing database with the specified name will get used
     * and not overwritten.
     */
    public async createDb(name: string, projectDocument?: Document, configurationDocument?: ConfigurationDocument,
                          destroyBeforeCreate: boolean = false): Promise<PouchDB.Database> {

        let db = this.pouchDbFactory(name);

        if (destroyBeforeCreate) {
            await db.destroy();
            db = this.pouchDbFactory(name);
        }

        // Create project & configuration documents only if they do not exist,
        // which can happen if the db already existed

        if (projectDocument) {
            try {
                await db.get('project');
            } catch {
                await db.put(projectDocument);

                if (configurationDocument) {
                    try {
                        await db.get('configuration');
                    } catch {
                        await db.put(configurationDocument);
                    }
                }
            }
        }

        this.db = db;

        return db;
    }

    
    public close() {

        if (this.db) this.db.close();
    }

    
    public changesNotifications = (): Observable<Document> => ObserverUtil.register(this.changesObservers);

    public deletedNotifications = (): Observable<Document> => ObserverUtil.register(this.deletedObservers);


    /**
     * @returns newest revision of the document fetched from db
     * @throws [DOCUMENT_RESOURCE_ID_EXISTS]
     * @throws [INVALID_DOCUMENT] - in case either the document given as param or
     *   the document fetched directly after db.put is not valid
     */
    public async create(document: NewDocument, username: string): Promise<Document> {

        if (!Document.isValid(document as Document, true)) throw [DatastoreErrors.INVALID_DOCUMENT];
        if (document.resource.id) {
            await this.assertNotExists(document.resource.id);
            this.deletedOnes = this.deletedOnes.filter(id => id !== document.resource.id);
        }

        try {
            return await this.performPut(
                PouchdbDatastore.initializeDocument(document, username, this.idGenerator.generateId()));
        } catch (err) {
            throw [DatastoreErrors.GENERIC_ERROR, err];
        }
    }


    public async bulkCreate(documents: Array<NewDocument>, username: string): Promise<Array<Document>> {

        const initializedDocuments: Array<Document> = await Promise.all(
            documents.map(async document => {
                if (!Document.isValid(document as Document, true)) {
                    throw [DatastoreErrors.INVALID_DOCUMENT];
                }
                if (document.resource.id) await this.assertNotExists(document.resource.id);
                return PouchdbDatastore.initializeDocument(document, username, this.idGenerator.generateId());
            })
        );

        return this.performBulkDocs(initializedDocuments);
    }


    /**
     * @returns newest revision of the document fetched from db
     * @throws [DOCUMENT_NOT_FOUND]
     * @throws [INVALID_DOCUMENT] - in case either the document given as param or
     *   the document fetched directly after db.put is not valid
     */
    public async update(document: Document, username: string,
                        squashRevisionsIds?: string[]): Promise<Document> {

        if (!document.resource.id) throw [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID];
        if (!Document.isValid(document)) throw [DatastoreErrors.INVALID_DOCUMENT];

        const fetchedDocument = await this.fetch(document.resource.id, undefined, true);

        const clonedDocument = Document.clone(document);
        clonedDocument.created = fetchedDocument.created;
        clonedDocument.modified = fetchedDocument.modified;
        if (squashRevisionsIds) {
            await this.mergeModifiedDates(clonedDocument, squashRevisionsIds);
            await this.removeRevisions(clonedDocument.resource.id, squashRevisionsIds);
        }
        clonedDocument.modified.push({ user: username, date: new Date() });
        (clonedDocument as any)['_id'] = clonedDocument.resource.id;

        try {
            return await this.performPut(clonedDocument);
        } catch (err) {
            if (err.name && err.name === 'conflict') {
                throw [DatastoreErrors.SAVE_CONFLICT];
            } else {
                console.error('Error while updating resource:', err);
                throw [DatastoreErrors.GENERIC_ERROR, err];
            }
        }
    }


    public bulkUpdate(documents: Array<Document>, username: string): Promise<Array<Document>> {

        for (let document of documents) {
            if (!document.resource.id) throw [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID];
            if (!Document.isValid(document as Document, true)) {
                throw [DatastoreErrors.INVALID_DOCUMENT];
            }
            document.modified.push({ user: username, date: new Date() });
        }

        return this.performBulkDocs(documents);
    }


    /**
     * @throws [DOCUMENT_NOT_FOUND]
     */
    public async remove(document: Document): Promise<void> {

        if (!document.resource.id) throw [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID];

        this.deletedOnes.push(document.resource.id as never);

        const fetchedDocument = await this.fetch(document.resource.id, {}, true) as any;

        if (fetchedDocument._conflicts && fetchedDocument._conflicts.length > 0) {
            await this.removeRevisions(fetchedDocument.resource.id, fetchedDocument._conflicts);
        }

        try {
            await this.db.remove(fetchedDocument)
        } catch (genericerror) {
            throw [DatastoreErrors.GENERIC_ERROR, genericerror];
        }
    }


    /**
     * @param resourceId
     * @param options
     * @param skipValidation
     * @throws [DOCUMENT_NOT_FOUND]
     * @throws [INVALID_DOCUMENT] if not Document.isValid
     * @returns Document. It is made sure that it isValid and the dates are converted to type Date.
     */
    public fetch(resourceId: string, options: any = {}, skipValidation: boolean = false): Promise<Document> {
        // Beware that for this to work we need to make sure
        // the document _id/id and the resource.id are always the same.

        options.conflicts = true;

        return this.db.get(resourceId, options)
            .then(
                (result: any) => {
                    PouchdbDatastore.autoFixCategory(result);
                    if (!skipValidation) {
                        if (!Document.isValid(result)) return Promise.reject([DatastoreErrors.INVALID_DOCUMENT]);
                    }
                    PouchdbDatastore.convertDates(result);
                    return Promise.resolve(result as Document);
                },
                (_: any) => Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND]))
    }


    public async bulkFetch(resourceIds: string[]): Promise<Array<Document>> {

        const options = {
            keys: resourceIds,
            conflicts: true,
            include_docs: true
        };

        return (await this.db.allDocs(options)).rows.map((row: any) => {
            if (!row.doc) {
                console.warn('Document not found: ' + row.key);
                return undefined;
            }
            PouchdbDatastore.autoFixCategory(row.doc);
            if (!Document.isValid(row.doc)) {
                console.warn('Invalid document', row.doc);
                return undefined;
            }
            PouchdbDatastore.convertDates(row.doc);
            return row.doc;
        }).filter((document: Document) => document !== undefined);
    }


    /**
     * @throws [DOCUMENT_NOT_FOUND]
     * @throws [INVALID_DOCUMENT]
     */
    public fetchRevision(resourceId: string, revisionId: string): Promise<Document> {

        return this.fetch(resourceId, { rev: revisionId });
    }


    public setupChangesEmitter(): void {

        this.db.changes({
            live: true,
            include_docs: false, // we do this and fetch it later because there is a possible leak, as reported in https://github.com/pouchdb/pouchdb/issues/6502
            conflicts: true,
            since: 'now'
        }).on('change', (change: any) => {
            // it is noteworthy that currently often after a deletion of a document we get a change that does not reflect deletion.
            // neither is change.deleted set nor is sure if the document already is deleted (meaning fetch still works)

            if (!change || !change.id) return;
            if (change.id.indexOf('_design') === 0) return; // starts with _design

            if (change.deleted || this.deletedOnes.indexOf(change.id as never) != -1) {
                ObserverUtil.notify(this.deletedObservers, { resource: { id: change.id } } as Document);
                return;
            }

            this.handleNonDeletionChange(change.id);

        }).on('complete', (info: any) => {
            // console.debug('changes stream was canceled', info);
        }).on('error', (err: any) => {
            console.error('changes stream errored', err);
        });
    }


    public async getLatestChange(): Promise<string|undefined> {

        return (await this.db.changes({ descending: true, limit: 1 }))?.results?.[0]?.id;
    }


    private async performPut(document: Document) {

        const cleanedDocument = PouchdbDatastore.cleanUp(document);

        await this.db.put(cleanedDocument, { force: true });
        return this.fetch(cleanedDocument.resource.id);
    }


    private async performBulkDocs(documents: Array<Document>): Promise<Array<Document>> {

        const cleanedUpDocuments = documents.map(PouchdbDatastore.cleanUp);

        await this.db.bulkDocs(cleanedUpDocuments);
        return this.bulkFetch(cleanedUpDocuments.map(document => document.resource.id));
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
            throw [DatastoreErrors.REMOVE_REVISIONS_ERROR, err];
        }
    }


    private async handleNonDeletionChange(changeId: string): Promise<void> {

        try {
            ObserverUtil.notify(this.changesObservers, await this.fetch(changeId));
        } catch (e) {
            console.warn('PouchdbDatastore.handleNonDeletionChange: Document not found or not valid:', changeId, e);
        }
    }


    private async assertNotExists(resourceId: string) {

        let exists = false;
        try {
            await this.db.get(resourceId);
            exists = true;
        } catch { }
        if (exists) throw [DatastoreErrors.DOCUMENT_RESOURCE_ID_EXISTS];
    }


    private static convertDates(result: any): Document {

        result.created.date = new Date(result.created.date);
        for (let modified of result.modified) modified.date = new Date(modified.date);
        return result;
    }


    private static initializeDocument(document: NewDocument, username: string,
                                      generatedId: string): Document {

        const clonedDocument = Document.clone(document) as Document;
        if (!clonedDocument.resource.id) clonedDocument.resource.id = generatedId;
        (clonedDocument as any)['_id'] = clonedDocument.resource.id;
        (clonedDocument as any)['created'] = { user: username, date: new Date() };
        (clonedDocument as any)['modified'] = [];

        return clonedDocument;
    }


    private static cleanUp(document: Document): Document {

        const clonedDocument = Document.clone(document);
        return Document.removeEmptyRelationArrays(clonedDocument);
    }


    private static autoFixCategory(document: Document) {

        if (document.resource.id === 'project') document.resource.category = 'Project';
        if (document.resource.id === 'configuration') document.resource.category = 'Configuration';
    }
}

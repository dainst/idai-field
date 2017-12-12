import {Constraint, DatastoreErrors, Query} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {IdGenerator} from './id-generator';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {PouchdbManager} from './pouchdb-manager';
import {ResultSets} from './result-sets';
import {ConstraintIndexer} from './constraint-indexer';
import {FulltextIndexer} from './fulltext-indexer';
import {AppState} from '../../settings/app-state';
import {ConflictResolvingExtension} from './conflict-resolving-extension';
import {ConflictResolver} from './conflict-resolver';
import {ChangeHistoryUtil} from '../../model/change-history-util';

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PouchdbDatastore {

    protected db: any;
    private allChangesAndDeletionsObservers = [];
    private remoteChangesObservers = [];

    // There is an issue where docs pop up in }).on('change',
    // despite them beeing deleted in remove before. When they
    // pop up in 'change', they do not have the deleted property.
    // So in order to identify them as to remove from the indices
    // they are marked 'manually'.
    private deletedOnes = [];


    constructor(
        private pouchdbManager: PouchdbManager,
        private constraintIndexer: ConstraintIndexer,
        private fulltextIndexer: FulltextIndexer,
        private appState: AppState,
        private conflictResolvingExtension: ConflictResolvingExtension,
        private conflictResolver: ConflictResolver
        ) {

        this.db = pouchdbManager.getDb();
        conflictResolvingExtension.setDatastore(this);
        conflictResolvingExtension.setDb(this.db);
        conflictResolvingExtension.setConflictResolver(conflictResolver);

        this.setupServer().then(() => this.setupChangesEmitter());
    }


    /**
     * @returns {Promise<Document>} newest revision of the document fetched from db
     * @throws [INVALID_DOCUMENT] - in case either the document given as param or
     *   the document fetched directly after db.put is not valid
     */
    public async create(document: Document): Promise<Document> {

        if (!Document.isValid(document, true)) throw [DatastoreErrors.INVALID_DOCUMENT];
        if (document.resource.id) try {
            await this.db.get(document.resource.id);
            throw 'exists';
        } catch (expected) {
            if (expected === 'exists') throw [DatastoreErrors.DOCUMENT_RESOURCE_ID_EXISTS]
        }

        const resetFun = this.resetDocOnErr(document);
        if (!document.resource.id) document.resource.id = IdGenerator.generateId();
        (document as any)['_id'] = document.resource.id;

        return this.performPut(document, resetFun, (err: any) =>
            Promise.reject([DatastoreErrors.GENERIC_ERROR, err])
        );
    }


    /**
     * @returns {Promise<Document>} newest revision of the document fetched from db
     * @throws [INVALID_DOCUMENT] - in case either the document given as param or
     *   the document fetched directly after db.put is not valid
     */
    public async update(document: Document): Promise<Document> {

        if (!Document.isValid(document, true)) throw [DatastoreErrors.INVALID_DOCUMENT];
        if (!document.resource.id) throw [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID];
        try {
            await this.db.get(document.resource.id);
        } catch (e) {
            throw [DatastoreErrors.DOCUMENT_NOT_FOUND];
        }

        const resetFun = this.resetDocOnErr(document);
        (document as any)['_id'] = document.resource.id;

        return this.performPut(document, resetFun, (err: any) => {
            if (err.name && err.name == 'conflict') {
                throw [DatastoreErrors.SAVE_CONFLICT];
            } else {
                throw [DatastoreErrors.GENERIC_ERROR, err];
            }
        })
    }


    /**
     * @throws [DOCUMENT_NOT_FOUND]
     */
    public async remove(doc: Document): Promise<void> {

        if (!doc.resource.id) throw [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID];

        this.deletedOnes.push(doc.resource.id as never);
        // we want the doc removed from the indices asap,
        // in order to not risk someone finding it still with findIds due to
        // issues that are theoretically possible because we cannot know
        // when .on('change' fires. so we do remove it here,
        // although we know it will be done again for the same doc
        // in .on('change'
        this.constraintIndexer.remove(doc);
        this.fulltextIndexer.remove(doc);

        this.notifyAllChangesAndDeletionsObservers();

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


    // TODO improve error handling, consider using PouchdbDatastore#remove
    public async removeRevision(docId: string, revisionId: string): Promise<any> {

        try {
            await this.db.remove(docId, revisionId);
            await this.reindex(docId);
        } catch (genericerr) {
            throw [DatastoreErrors.GENERIC_ERROR, genericerr];
        }
    }


    /**
     * @param query
     * @return an array of the resource ids of the documents the query matches.
     *   the sort order of the ids is determinded in that way that ids of documents with newer modified
     *   dates come first. they are sorted by last modfied descending, so to speak.
     *   if two or more documents have the same last modifed date, their sort order is unspecified.
     *   the modified date is taken from document.modified[document.modified.length-1].date
     */
    public async findIds(query: Query): Promise<string[]> {

        if (!query) return [];

        try {
            return this.perform(query);
        } catch (err) {
            throw [DatastoreErrors.GENERIC_ERROR, err];
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
                    return result as Document;
                },
                (err: any) => Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND]))
    }


    /**
     * @throws [DOCUMENT_NOT_FOUND]
     * @throws [INVALID_DOCUMENT]
     */
    public fetchRevision(resourceId: string, revisionId: string): Promise<Document> {

        return this.fetch(resourceId, { rev: revisionId });
    }


    public async fetchConflictedRevisions(resourceId: string): Promise<Array<Document>> {

        const conflictedRevisions: Array<Document> = [];

        const document: Document = await this.fetch(resourceId);

        if ((document as any)['_conflicts']) {
            for (let revisionId of (document as any)['_conflicts']) {
                conflictedRevisions.push(await this.fetchRevision(document.resource.id as string, revisionId));
            }
        }

        return Promise.resolve(conflictedRevisions);
    }


    public async findConflicted(): Promise<Document[]> {

        return (await this.db.query('conflicted', {
            include_docs: true,
            conflicts: true,
            descending: true
        })).rows.map((result: any) => result.doc);
    }


    public allChangesAndDeletionsNotifications(): Observable<void> {

        return Observable.create((observer: Observer<void>) => {
            this.allChangesAndDeletionsObservers.push(observer as never);
        });
    }


    public remoteChangesNotifications(): Observable<Document> {

        return Observable.create((observer: Observer<Document>) => {
            this.remoteChangesObservers.push(observer as never);
        });
    }


    protected setupServer() {

        return Promise.resolve();
    }


    private async perform(query: Query): Promise<any> {

        await this.db.ready();

        const resultSets = query.constraints ?
            this.performThem(query.constraints) :
            ResultSets.make();

        return ResultSets.generateOrderedResultList(
            Query.isEmpty(query) && !ResultSets.isEmpty(resultSets) ?
                resultSets :
                this.performFulltext(query, resultSets));
    }


    private performFulltext(query: Query, resultSets: ResultSets): ResultSets {

        return ResultSets.combine(resultSets,
            this.fulltextIndexer.get(
                !query.q || query.q.trim() == '' ? '*' : query.q,
                query.types));
    }


    /**
     * @param constraints
     * @returns {any} undefined if there is no usable constraint
     */
    private performThem(constraints: { [name: string]: Constraint|string }): ResultSets {

        return Object.keys(constraints).reduce((setsAcc: ResultSets, name: string) => {

                const {type, value} = Constraint.convertTo(constraints[name]);
                return ResultSets.combine(
                    setsAcc, this.constraintIndexer.get(name, value), type);

            }, ResultSets.make());
    }


    private async performPut(document: any, resetFun: any, errFun: any) {

        try {
            document['_rev'] = (await this.db.put(document, { force: true })).rev;
            return this.reindex(document.resource.id);
        } catch (err) {
            resetFun(document);
            return errFun(err);
        }
    }


    private async reindex(resourceId: string): Promise<Document> {

        const newestRevision: Document = await this.fetch(resourceId);

        this.constraintIndexer.put(newestRevision);
        this.fulltextIndexer.put(newestRevision);

        this.notifyAllChangesAndDeletionsObservers();

        return newestRevision;
    }


    private resetDocOnErr(original: Document) {

        const created = JSON.parse(JSON.stringify(original.created));
        const modified = JSON.parse(JSON.stringify(original.modified));
        const id = original.resource.id;
        return function(document: Document) {
            delete (document as any)['_id'];
            document.resource.id = id;
            document.created = created;
            document.modified = modified;
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
                // TODO do further investigation, maybe file an issue for pouchdb

                if (change && change.id && (change.id.indexOf('_design') == 0)) return; // starts with _design
                if (!change || !change.id) return;

                if (change.deleted || this.deletedOnes.indexOf(change.id as never) != -1) {
                    this.constraintIndexer.remove({resource: {id: change.id}} as Document);
                    this.fulltextIndexer.remove({resource: {id: change.id}} as Document);
                    this.notifyAllChangesAndDeletionsObservers();
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

        let conflictedRevisions: Array<Document>;
        try {
            conflictedRevisions = await this.fetchConflictedRevisions(changeId);
        } catch (e) {
            console.warn('Failed to fetch conflicted revisions for document', changeId);
            throw e;
        }

        if (!ChangeHistoryUtil.isRemoteChange(document, conflictedRevisions, this.appState.getCurrentUser())) {
            return;
        }

        this.constraintIndexer.put(document);
        this.fulltextIndexer.put(document);

        try {
            this.notifyRemoteChangesObservers(document);
        } catch (e) {
            console.error('Error while notify observer');
        }

        this.notifyAllChangesAndDeletionsObservers();
    }


    private notifyAllChangesAndDeletionsObservers() {

        if (this.allChangesAndDeletionsObservers) {
            this.allChangesAndDeletionsObservers.forEach((observer: any) => observer.next());
        }
    }


    private notifyRemoteChangesObservers(document: Document) {

        if (this.remoteChangesObservers) this.remoteChangesObservers.
            forEach((observer: Observer<Document>) => observer.next(document));
    }


    private static convertDates(result: any): Document {

        result.created.date = new Date(result.created.date);
        for (let modified of result.modified) {
            modified.date = new Date(modified.date);
        }
        return result;
    }
}

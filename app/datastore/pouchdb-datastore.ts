import {Query, DatastoreErrors, DocumentChange} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {IdGenerator} from './id-generator';
import {Observable} from 'rxjs/Observable';
import {PouchdbManager} from './pouchdb-manager';
import {ResultSets} from '../util/result-sets';
import {SortUtil} from '../util/sort-util';
import {ConstraintIndexer} from './constraint-indexer';
import {FulltextIndexer} from './fulltext-indexer';
import {AppState} from '../app-state';
import {ConflictResolvingExtension} from './conflict-resolving-extension';
import {ConflictResolver} from "./conflict-resolver";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PouchdbDatastore {

    protected db: any;
    private documentChangesObservers = [];

    // There is an issue where docs pop up in }).on('change',
    // despite them beeing deleted in remove before. When they
    // pop up in 'change', they do not have the deleted property.
    // So in order to identify them as to remove from the indices
    // they are marked "manually".
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
     * @param document
     * @returns {Promise<Document>} newest revision of the document fetched from db
     */
    public create(document: Document): Promise<Document> {

        const resetFun = this.resetDocOnErr(document);

        return this.proveThatDoesNotExist(document)
            .then(() => {
                if (!document.resource.id) {
                    document.resource.id = IdGenerator.generateId();
                }
                document['_id'] = document.resource.id;
            })
            .then(() => this.performPut(document, resetFun, err =>
                Promise.reject([DatastoreErrors.GENERIC_ERROR, err])
            ));
    }

    /**
     * @param document
     * @returns {Promise<Document>} newest revision of the document fetched from db
     */
    public update(document: Document): Promise<Document> {

        if (!document.resource.id) {
            return Promise.reject([DatastoreErrors.DOCUMENT_NO_RESOURCE_ID]);
        }

        const resetFun = this.resetDocOnErr(document);

        return this.fetch(document.resource.id).then(() => {
                document['_id'] = document.resource.id;
            }).catch(() => Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND]))
            .then(() => this.performPut(document, resetFun, err => {
                if (err.name && err.name == 'conflict') {
                    return Promise.reject([DatastoreErrors.SAVE_CONFLICT]);
                } else {
                    return Promise.reject([DatastoreErrors.GENERIC_ERROR, err]);
                }
            }));
    }

    /**
     * @param doc
     * @returns {Promise<undefined>}
     */
    public remove(doc: Document): Promise<undefined> {

        if (doc.resource.id == null) {
            return <any> Promise.reject([DatastoreErrors.DOCUMENT_NO_RESOURCE_ID]);
        }

        this.deletedOnes.push(doc.resource.id);
        // we want the doc removed from the indices asap,
        // in order to not risk someone finding it still with findIds due to
        // issues that are theoretically possible because we cannot know
        // when .on('change' fires. so we do remove it here,
        // although we know it will be done again for the same doc
        // in .on('change'
        this.constraintIndexer.remove(doc);
        this.fulltextIndexer.remove(doc);

        return this.fetch(doc.resource.id).then(
            docFromGet => this.db.remove(docFromGet)
                .catch(err => Promise.reject([DatastoreErrors.GENERIC_ERROR, err])),
            () => Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND])
        );
    }

    public removeRevision(docId: string, revisionId: string): Promise<any> {

        return this.db.remove(docId, revisionId)
            .catch(err => {
                return Promise.reject([DatastoreErrors.GENERIC_ERROR, err]);
            });
    }

    /**
     * @param query
     * @return an array of the resource ids of the documents the query matches.
     *   the sort order of the ids is determinded in that way that ids of documents with newer modified
     *   dates come first. they are sorted by last modfied descending, so to speak.
     *   if two or more documents have the same last modifed date, their sort order is unspecified.
     *   the modified date is taken from document.modified[document.modified.length-1].date
     */
    public findIds(query: Query): Promise<string[]> {

        if (!query) return Promise.resolve([]);

        return this.perform(query)
            .catch(err => Promise.reject([DatastoreErrors.GENERIC_ERROR, err]))
    }

    public fetch(resourceId: string,
                 options: any = { conflicts: true }): Promise<Document> {
        // Beware that for this to work we need to make sure
        // the document _id/id and the resource.id are always the same.
        return this.db.get(resourceId, options)
            .then(result => this.createDocFromResult(result) )
            .catch(err => Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND]));
    }

    public fetchRevision(resourceId: string, revisionId: string) {

        return this.fetch(resourceId, { rev: revisionId });
    }

    public findConflicted(): Promise<Document[]> {

        return this.db.query('conflicted', {
            include_docs: true,
            conflicts: true,
            descending: true
        })
            .then(result => result.rows.map(result => result.doc))
    }

    public documentChangesNotifications(): Observable<DocumentChange> {

        return Observable.create(observer => {
            this.documentChangesObservers.push(observer);
        });
    }

    protected setupServer() {

        return Promise.resolve();
    }

    /**
     * Creates a typed Document from an untyped PouchDB result.
     * Thereby converts dates in created in modified that are given as strings
     * in JSON to Date objects.
     * @param result the result as returned from PouchDB
     * @returns {Document} the typed Document
     */
    private createDocFromResult(result: any): Document {
        result.created.date = new Date(result.created.date);
        if (result.modified) for (let modified of result.modified) {
            modified.date = new Date(modified.date);
        }
        return result;
    }

    private perform(query: Query): Promise<any> {

        return this.db.ready()
            .then(() => {
                const resultSets: ResultSets = this.performThem(query.constraints);
                if (PouchdbDatastore.isEmpty(query) && resultSets) return resultSets;
                else return this.performFulltext(query, resultSets ? resultSets : new ResultSets());
            })
            .then(resultSets => this.generateOrderedResultList(resultSets));
    }

    private performFulltext(query: Query, resultSets: ResultSets): ResultSets {

        const q: string = (!query.q || query.q.trim() == '') ? '*' : query.q;
        const types: string[] = query.types ? query.types : undefined;
        resultSets.add(this.fulltextIndexer.get(q, types));
        return resultSets;
    }

    private generateOrderedResultList(resultSets: ResultSets): Array<any> {

        return resultSets.intersect(e => e.id)
            .sort((a,b) => SortUtil.alnumCompare(a['identifier'], b['identifier']))
            .map(e => e['id']);
    }

    /**
     * @param constraints
     * @returns {any} undefined if there is no usable constraint
     */
    private performThem(constraints): ResultSets {

        if (!constraints) return undefined;

        const resultSets: ResultSets = new ResultSets();
        let usableConstraints = 0;
        for (let constraint of Object.keys(constraints)) {
            let result = this.constraintIndexer.get(constraint, constraints[constraint]);
            if (result) {
                resultSets.add(result);
                usableConstraints++;
            }
        }
        if (usableConstraints == 0) return undefined;
        return resultSets;
    }

    /**
     * @param doc
     * @return resolve when document with the given resource id does not exist already, reject otherwise
     */
    private proveThatDoesNotExist(doc: Document): Promise<any> {

        if (doc.resource.id) {
            return this.fetch(doc.resource.id)
                .then(result => Promise.reject([DatastoreErrors.DOCUMENT_RESOURCE_ID_EXISTS]), () => Promise.resolve())
        } else return Promise.resolve();
    }

    private notifyDocumentChangesObservers(documentChange: DocumentChange) {

        if (!this.documentChangesObservers) return;
        this.removeClosedObservers();

        this.documentChangesObservers.forEach(observer => {
            if (observer && (observer.next != undefined)) observer.next(documentChange);
        });
    }

    private removeClosedObservers() {

        const observersToDelete = [];
        for (let i = 0; i < this.documentChangesObservers.length; i++) {
            if (this.documentChangesObservers[i].closed) observersToDelete.push(this.documentChangesObservers[i]);
        }
        for (let observerToDelete of observersToDelete) {
            let i = this.documentChangesObservers.indexOf(observerToDelete);
            this.documentChangesObservers.splice(i, 1);
        }
    }

    private performPut(document, resetFun, errFun) {

        return this.db.put(document, { force: true })
            .then(result => this.processPutResult(document, result))
            .catch(err => {
                resetFun(document);
                return errFun(err);
            })
    }

    private processPutResult(document, result): Promise<Document> {

        this.constraintIndexer.put(document);
        this.fulltextIndexer.put(document);
        document['_rev'] = result['rev'];

        return this.fetch(document.resource.id);
    }

    private resetDocOnErr(original: Document) {

        const created = JSON.parse(JSON.stringify(original.created));
        const modified = JSON.parse(JSON.stringify(original.modified));
        const id = original.resource.id;
        return function(document: Document) {
            delete document['_id'];
            document.resource.id = id;
            document.created = created;
            document.modified = modified;
        }
    }

    private setupChangesEmitter(): void {

        this.db.ready().then(db => {

            db.changes({
                live: true,
                include_docs: false, // we do this and fetch it later because there is a possible leak, as reported in https://github.com/pouchdb/pouchdb/issues/6502
                conflicts: true,
                since: 'now'
            }).on('change', change => {
                // it is noteworthy that currently often after a deletion of a document we get a change that does not reflect deletion.
                // neither is change.deleted set nor is sure if the document already is deleted (meaning fetch still works)
                // TODO do further investigation, maybe file an issue for pouchdb

                if (change && change.id && (change.id.indexOf('_design') == 0)) return; // starts with _design
                if (!change || !change.id) return;

                const documentChange: DocumentChange = {
                    type: change.deleted ? 'deleted' : 'changed',
                    resourceId: change.id
                };

                if (change.deleted || this.deletedOnes.indexOf(change.id) != -1) {
                    this.constraintIndexer.remove({resource: {id: change.id}} as Document);
                    this.fulltextIndexer.remove({resource: {id: change.id}} as Document);
                    documentChange.type = 'deleted'; // for the same reason we use deletedOnes
                    return this.notifyDocumentChangesObservers(documentChange);
                }

                let document: Document;
                this.fetch(change.id).then(fetchedDoc => {
                    document = fetchedDoc;
                    // return this.conflictResolvingExtension.autoResolve(<any> document, this.appState.getCurrentUser());
                }).then(() => {
                    this.constraintIndexer.put(document);
                    this.fulltextIndexer.put(document);
                    documentChange.document = document;
                    this.notifyDocumentChangesObservers(documentChange);
                });
            }).on('complete', info => {
                // console.debug('changes stream was canceled', info);
            }).on('error', err => {
                console.error('changes stream errored', err);
            });
        });
    }

    // TODO Move to query interface (make query a class if necessary)
    private static isEmpty(query: Query) {

        return ((!query.q || query.q == '') && !query.types);
    }
}

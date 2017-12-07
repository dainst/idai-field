import {Query, Constraint, DatastoreErrors} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {IdGenerator} from './id-generator';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {PouchdbManager} from './pouchdb-manager';
import {ResultSets} from '../../../util/result-sets';
import {SortUtil} from '../../../util/sort-util';
import {ConstraintIndexer} from './constraint-indexer';
import {FulltextIndexer} from './fulltext-indexer';
import {AppState} from '../../settings/app-state';
import {ConflictResolvingExtension} from './conflict-resolving-extension';
import {ConflictResolver} from './conflict-resolver';
import {ModelUtil} from '../../model/model-util';
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
                (document as any)['_id'] = document.resource.id;
            })
            .then(() => this.performPut(document, resetFun, (err: any) =>
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
            (document as any)['_id'] = document.resource.id;
        }).catch(() => Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND]))
            .then(() => this.performPut(document, resetFun, (err: any) => {
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

        this.deletedOnes.push(doc.resource.id as never);
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
                .catch((err: any) => Promise.reject([DatastoreErrors.GENERIC_ERROR, err])),
            () => Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND])
        );
    }


    public removeRevision(docId: string, revisionId: string): Promise<any> {

        return this.db.remove(docId, revisionId)
            .catch((err: any) => {
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
            .then((result: any) => PouchdbDatastore.createDocFromResult(result) )
            .catch((err: any) => Promise.reject([DatastoreErrors.DOCUMENT_NOT_FOUND]));
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
            .then((result: any) => result.rows.map((result: any) => result.doc))
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


    private perform(query: Query): Promise<any> {

        return this.db.ready()
            .then(() => {
                const resultSets: ResultSets|undefined = this.performThem(query.constraints);
                if (PouchdbDatastore.isEmpty(query) && resultSets) return resultSets;
                else return this.performFulltext(query, resultSets ? resultSets : new ResultSets());
            })
            .then((resultSets: any) => this.generateOrderedResultList(resultSets));
    }


    private performFulltext(query: Query, resultSets: ResultSets): ResultSets {

        const q: string = (!query.q || query.q.trim() == '') ? '*' : query.q;
        const types: string[]|undefined = query.types ? query.types : undefined;
        resultSets.add(this.fulltextIndexer.get(q, types as any));
        return resultSets;
    }


    private generateOrderedResultList(resultSets: ResultSets): Array<any> {

        return resultSets.intersect((e: any) => e.id)
            .sort((a: any, b: any) => SortUtil.alnumCompare(a['identifier'], b['identifier']))
            .map((e: any) => e['id']);
    }


    /**
     * @param constraints
     * @returns {any} undefined if there is no usable constraint
     */
    private performThem(constraints: { [name: string]: Constraint|string }|undefined): ResultSets|undefined {

        if (!constraints) return undefined;

        const resultSets: ResultSets = new ResultSets();
        let usableConstraints = 0;
        for (let name of Object.keys(constraints)) {
            const constraint = PouchdbDatastore.convertToConstraint(constraints[name]);

            let result = this.constraintIndexer.get(name, constraint.value);
            if (result) {
                if (constraint.type == 'add') {
                    resultSets.add(result);
                } else if (constraint.type == 'subtract') {
                    resultSets.subtract(result);
                }
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


    private performPut(document: any, resetFun: any, errFun: any) {

        return this.db.put(document, { force: true })
            .then((result: any) => this.processPutResult(document, result))
            .catch((err: any) => {
                resetFun(document);
                return errFun(err);
            })
    }


    private processPutResult(document: any, result: any): Promise<Document> {

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

                let document: Document;
                this.fetch(change.id).then(fetchedDoc => {
                    document = fetchedDoc;
                    // return this.conflictResolvingExtension.autoResolve(<any> document, this.appState.getCurrentUser());
                }).then(() => {
                    if (!ModelUtil.hasNecessaryFields(document)) {
                        console.warn('Failed to index document from remote. One or more necessary fields are missing.',
                            document);
                    } else {
                        if (!ChangeHistoryUtil.isRemoteChange(document, this.appState.getCurrentUser())) return;

                        this.constraintIndexer.put(document);
                        this.fulltextIndexer.put(document);
                        try {
                            this.notifyRemoteChangesObservers(document);
                        } catch (e) {
                            console.error('Error while notify observer');
                        }
                        this.notifyAllChangesAndDeletionsObservers();
                    }
                }).catch(err => {
                    console.error('Error while trying to index changed document with id ' + change.id +
                        ' from remote', err);
                });
            }).on('complete', (info: any) => {
                // console.debug('changes stream was canceled', info);
            }).on('error', (err: any) => {
                console.error('changes stream errored', err);
            });
        });
    }


    private notifyAllChangesAndDeletionsObservers() {

        if (!this.allChangesAndDeletionsObservers) return;

        PouchdbDatastore.removeClosedObservers(this.allChangesAndDeletionsObservers);

        this.allChangesAndDeletionsObservers.forEach((observer: any) => {
            if (observer && (observer.next != undefined)) observer.next();
        });
    }


    private notifyRemoteChangesObservers(document: Document) {

        if (!this.remoteChangesObservers) return;

        PouchdbDatastore.removeClosedObservers(this.remoteChangesObservers);

        this.remoteChangesObservers.forEach((observer: any) => {
            if (observer && (observer.next != undefined)) observer.next(document);
        });
    }


    private static removeClosedObservers(observers: Array<any>) {

        const observersToDelete: any[] = [];
        for (let i = 0; i < observers.length; i++) {
            if ((observers[i] as any).closed) observersToDelete.push(observers[i]);
        }
        for (let observerToDelete of observersToDelete) {
            let i = observers.indexOf(observerToDelete as never);
            observers.splice(i, 1);
        }
    }


    /**
     * Creates a typed Document from an untyped PouchDB result.
     * Thereby converts dates in created in modified that are given as strings
     * in JSON to Date objects.
     * @param result the result as returned from PouchDB
     * @returns {Document} the typed Document
     */
    private static createDocFromResult(result: any): Document {

        if (result.created) result.created.date = new Date(result.created.date);
        if (result.modified) for (let modified of result.modified) {
            modified.date = new Date(modified.date);
        }
        return result;
    }


    // TODO Move to query interface (make query a class if necessary)
    private static isEmpty(query: Query) {

        return ((!query.q || query.q == '') && !query.types);
    }


    // TODO Move to query interface (make query a class if necessary)
    private static convertToConstraint(constraint: Constraint|string): Constraint {

        if (typeof(constraint) == 'string') {
            return { value: constraint, type: 'add' };
        } else {
            return constraint;
        }
    }
}

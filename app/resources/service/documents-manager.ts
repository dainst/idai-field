import {Datastore, DocumentChange, Query} from 'idai-components-2/datastore';
import {Action, Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';
import {MainTypeManager} from "./main-type-manager";
import {ViewManager} from './view-manager';
import {Loading} from "../../widgets/loading";
import {M} from "../../m";
import {SettingsService} from '../../settings/settings-service';
import {IdaiFieldDocument} from "idai-components-2/idai-field-model";

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DocumentsManager {

    public projectDocument: IdaiFieldDocument; // TODO make private
    public selectedDocument: Document; // TODO make private
    public documents: Array<Document>; // TODO make private
    private newDocumentsFromRemote: Array<Document> = [];


    constructor(
        private mainTypeManager: MainTypeManager,
        private datastore: Datastore,
        private viewManager: ViewManager,
        private loading: Loading,
        private settingsService: SettingsService
    ) {

        datastore.documentChangesNotifications().subscribe(documentChange => {
            this.handleChange(
                documentChange, this.selectedDocument);
        });
    }


    public getQuery() {

        return {
            q: this.viewManager.getQueryString(),
            types: this.viewManager.getQueryTypes()
        }
    }


    public setQueryString(q: string): boolean {

        this.viewManager.setQueryString(q);

        let result = true;
        if (!this.viewManager.isSelectedDocumentMatchedByQueryString(this.selectedDocument)) {
            result = false;
            this.deselect();
        }

        this.populateDocumentList();
        return result;
    }


    public setQueryTypes(types: string[]): boolean {

        this.viewManager.setFilterTypes(types);

        let result = true;
        if (!this.viewManager.isSelectedDocumentTypeInTypeFilters(this.selectedDocument)) {
            result = false;
            this.deselect();
        }

        this.populateDocumentList();
        return result;
    }


    public removeFromListOfNewDocumentsFromRemote(document: Document) {

        let index = this.newDocumentsFromRemote.indexOf(document);
        if (index > -1) this.newDocumentsFromRemote.splice(index, 1);
    }


    public deselect() {

        this.selectedDocument = undefined;
    }


    public selected() {

        return this.selectedDocument;
    }


    public setSelectedById(resourceId: string) {

        return this.datastore.get(resourceId).then(
            document => {
                return this.setSelected(document);
            }
        );
    }


    /**
     * Sets the this.selectedDocument
     * and if necessary, also
     * a) selects the operation type document,
     * this.selectedDocument is recorded in, accordingly and
     * b) invalidates query settings in order to make sure
     * this.selectedDocument is part of the search hits of the document list
     * on the left hand side in the map view.
     *
     * The method also creates records relations (as inverse relations
     * of isRecordedIn) for operation type resources if we are in project view.
     *
     * @param documentToSelect
     * @returns {Document}
     */
    public setSelected(documentToSelect: Document) {

        if (!documentToSelect) return;
        this.selectedDocument = documentToSelect;

        const res1 = this.mainTypeManager.
            selectLinkedMainTypeDocumentForSelectedDocument(this.selectedDocument);
        const res2 = this.invalidateQuerySettingsIfNecessary();

        let promise = Promise.resolve();
        if (res1 || res2) promise = this.populateDocumentList();

        return promise.then(() => this.insertRecords(this.selectedDocument));
    }


    private handleChange(
        documentChange: DocumentChange,
        selectedDocument: Document) {

        if (documentChange.type == 'deleted') {
            console.debug('unhandled deleted document');
            return;
        }

        let changedDocument: Document = documentChange.document;

        if (!this.documents || !this.isRemoteChange(changedDocument)) return;
        if (DocumentsManager.isExistingDoc(changedDocument, this.documents)) return;

        if (changedDocument.resource.type == this.viewManager.getView().mainType) {
            return this.mainTypeManager.
            populateMainTypeDocuments(selectedDocument);
        }

        let oldDocuments = this.documents;
        this.populateDocumentList().then(() => {
            for (let doc of this.documents) {
                if (oldDocuments.indexOf(doc) == -1 && this.isRemoteChange(doc)) {
                    this.newDocumentsFromRemote.push(doc);
                }
            }
        });
    }


    private insertRecords(document: Document) {

        if (!this.mainTypeManager.selectedMainTypeDocument) return;
        if (this.mainTypeManager.selectedMainTypeDocument.resource.type == 'Project') {
            return this.insertRecordsRelation(document);
        }
    }


    private insertRecordsRelation(selectedDocument: Document) {

        if (!selectedDocument) return;

        this.datastore.find({

            constraints: {
                'resource.relations.isRecordedIn' :
                selectedDocument.resource.id
            }

        }).then(documents => {

            selectedDocument.resource.relations['records'] = [];
            for (let doc of documents) {
                selectedDocument.resource.relations['records'].push(
                    doc.resource.id
                );
            }
        });
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    public populateDocumentList() {

        this.newDocumentsFromRemote = [];

        if (!this.mainTypeManager.selectedMainTypeDocument) {
            this.documents = [];
            return Promise.resolve();
        }

        return this.fetchDocuments(DocumentsManager.makeDocsQuery(
            {q: this.viewManager.getQueryString(), types: this.viewManager.getQueryTypes()},
            this.mainTypeManager.selectedMainTypeDocument.resource.id))
            .then(documents => {
                this.documents = documents;
                for (let doc of documents) { // TODO this could be a possible performance issue, but for now I wanted have it here and make insertDocs private, until we found a better place or another method for doing it
                    this.insertRecords(doc)
                }
            });
    }


    public populateProjectDocument(): Promise<any> {

        return this.datastore.get(this.settingsService.getSelectedProject())
            .then(document => this.projectDocument = document as IdaiFieldDocument)
            .catch(err => Promise.reject([M.DATASTORE_NOT_FOUND]));
    }


    public removeEmptyDocuments() {

        if (!this.documents) return;

        for (let document of this.documents) {
            if (!document.resource.id) this.remove(document);
        }
    }


    public remove(document: Document) {

        this.documents.splice(this.documents.indexOf(document), 1);
    }


    private isRemoteChange(changedDocument: Document): boolean {

        const latestAction: Action =
            (changedDocument.modified && changedDocument.modified.length > 0)
                ? changedDocument.modified[changedDocument.modified.length - 1]
                : changedDocument.created;

        return latestAction && latestAction.user != this.settingsService.getUsername();
    }


    public isNewDocumentFromRemote(document: Document): boolean {

        return this.newDocumentsFromRemote.indexOf(document) > -1;
    }

    /**
     * @returns {boolean} true if list needs to be reloaded afterwards
     */
    public invalidateQuerySettingsIfNecessary(): boolean {

        let result = false;
        if (!this.viewManager.isSelectedDocumentMatchedByQueryString(
                this.selectedDocument)) {
            this.viewManager.setQueryString('');
            result = true;
        }
        if (!this.viewManager.isSelectedDocumentTypeInTypeFilters(
                this.selectedDocument)) {
            this.viewManager.setFilterTypes([]);
            result = true;
        }
        return result;
    }


    private fetchDocuments(query: Query): Promise<any> {

        this.loading.start();
        return this.datastore.find(query)
            .catch(errWithParams => DocumentsManager.handleFindErr(errWithParams, query))
            .then(documents => {
                this.loading.stop(); return documents;
            });
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length == 2) console.error('Error with find. Cause:', errWithParams[1]);
    }


    private static isExistingDoc(changedDocument: Document, documents: Array<Document>): boolean {

        for (let doc of documents) {
            if (!doc.resource || !changedDocument.resource) continue;
            if (!doc.resource.id || !changedDocument.resource.id) continue;
            if (doc.resource.id == changedDocument.resource.id) return true;
        }
    }


    private static makeDocsQuery(query: Query, mainTypeDocumentResourceId: string): Query {

        const clonedQuery = JSON.parse(JSON.stringify(query));
        clonedQuery.constraints = { 'resource.relations.isRecordedIn': mainTypeDocumentResourceId };
        return clonedQuery;
    }
}
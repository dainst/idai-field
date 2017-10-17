import {Datastore, DocumentChange, Query} from 'idai-components-2/datastore';
import {Action, Document} from 'idai-components-2/core';
import {MainTypeManager} from './main-type-manager';
import {ViewManager} from './view-manager';
import {Loading} from '../../widgets/loading';
import {SettingsService} from '../../settings/settings-service';

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DocumentsManager {

    private selectedDocument: Document;
    private documents: Array<Document>;
    private newDocumentsFromRemote: Array<Document> = [];


    constructor(
        private datastore: Datastore,
        private loading: Loading,
        private settingsService: SettingsService,
        private viewManager: ViewManager,
        private mainTypeManager: MainTypeManager
    ) {

        datastore.documentChangesNotifications().subscribe(documentChange => {
            this.handleChange(
                documentChange, this.selectedDocument);
        });
    }


    public getDocuments() {

        return this.documents;
    }


    public getSelectedDocument() {

        return this.selectedDocument;
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


    private removeFromListOfNewDocumentsFromRemote(document: Document) {

        let index = this.newDocumentsFromRemote.indexOf(document);
        if (index > -1) this.newDocumentsFromRemote.splice(index, 1);
    }


    public deselect() {

        this.selectedDocument = undefined;
        this.removeEmptyDocuments(); // TODO consider using setSelected(undefined)
    }


    public setSelectedById(resourceId: string) {

        return this.datastore.get(resourceId).then(
            document => {
                return this.setSelected(document);
            }
        );
    }


    public setSelected(documentToSelect: Document): Promise<any> {

        if (documentToSelect == this.mainTypeManager.selectedMainTypeDocument) return;
        if (documentToSelect == this.selectedDocument) return;
        if (!documentToSelect) return;

        this.selectedDocument = documentToSelect;

        this.removeEmptyDocuments();
        if (documentToSelect && documentToSelect.resource && !documentToSelect.resource.id &&
            documentToSelect.resource.type != this.viewManager.getView().mainType) {

            this.documents.unshift(documentToSelect);
        }

        if (this.isNewDocumentFromRemote(documentToSelect)) {
            this.removeFromListOfNewDocumentsFromRemote(documentToSelect);
        }

        const res1 = this.mainTypeManager.
            selectLinkedMainTypeDocumentForSelectedDocument(this.selectedDocument);
        const res2 = this.invalidateQuerySettingsIfNecessary();

        let promise = Promise.resolve();
        if (res1 || res2) promise = this.populateDocumentList();

        return promise;
    }


    private handleChange(
        documentChange: DocumentChange,
        selectedDocument: Document) {

        if (documentChange.type == 'deleted') {
            console.debug('unhandled deleted document');
            return;
        }

        let changedDocument: Document = documentChange.document;

        if (!this.documents || !DocumentsManager.isRemoteChange(changedDocument,
                this.settingsService.getUsername())) return;
        if (DocumentsManager.isExistingDoc(changedDocument, this.documents)) return;

        if (changedDocument.resource.type == this.viewManager.getView().mainType) {
            return this.mainTypeManager.
            populateMainTypeDocuments(selectedDocument);
        }

        let oldDocuments = this.documents;
        this.populateDocumentList().then(() => {
            for (let doc of this.documents) {
                if (oldDocuments.indexOf(doc) == -1 &&
                    DocumentsManager.isRemoteChange(doc, this.settingsService.getUsername())) {
                    this.newDocumentsFromRemote.push(doc);
                }
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
            .then(documents => this.documents = documents)
            .then(() => this.removeEmptyDocuments());
    }


    private removeEmptyDocuments() {

        if (!this.documents) return;

        for (let document of this.documents) {
            if (!document.resource.id) this.remove(document);
        }
    }


    public remove(document: Document) {

        this.documents.splice(this.documents.indexOf(document), 1);
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


    private static isRemoteChange(changedDocument: Document, username: string): boolean { // TODO make static

        const latestAction: Action =
            (changedDocument.modified && changedDocument.modified.length > 0)
                ? changedDocument.modified[changedDocument.modified.length - 1]
                : changedDocument.created;

        return latestAction && latestAction.user != username;
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
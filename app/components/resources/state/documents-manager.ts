import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {Query} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {MainTypeDocumentsManager} from './main-type-documents-manager';
import {ViewManager} from './view-manager';
import {SettingsService} from '../../../core/settings/settings-service';
import {ChangeHistoryUtil} from '../../../core/model/change-history-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {ChangesStream} from '../../../core/datastore/core/changes-stream';
import {NavigationPath} from '../navigation-path';
import {ModelUtil} from '../../../core/model/model-util';
import {ResourcesState} from './resources-state';

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DocumentsManager {

    public projectDocument: Document;
    private selectedDocument: Document|undefined;
    private documents: Array<Document>;
    private newDocumentsFromRemote: Array<Document> = [];

    private deselectionObservers: Array<Observer<Document>> = [];


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private changesStream: ChangesStream,
        private settingsService: SettingsService,
        private viewManager: ViewManager,
        private mainTypeDocumentsManager: MainTypeDocumentsManager,
        private resourcesState: ResourcesState
    ) {

        changesStream.remoteChangesNotifications().
            subscribe(changedDocument => this.handleChange(changedDocument));
    }


    public async populateProjectDocument() {

        try {
            const document = await this.datastore.get(this.settingsService.getSelectedProject() as any);
            this.projectDocument = document;
        } catch (_) {
            console.log('cannot find project document')
        }
    }


    public getDocuments() {

        return this.documents;
    }


    public getSelectedDocument() {

        return this.selectedDocument;
    }


    public async setQueryString(q: string) {

        this.resourcesState.setQueryString(q);

        await this.populateDocumentList();
        this.deselectIfNotInList();
    }


    public async setQueryTypes(types: string[]) {

        this.viewManager.setFilterTypes(types);

        await this.populateDocumentList();
        this.deselectIfNotInList();
    }


    public async setNavigationPath(navigationPath: NavigationPath) {

        const selectedMainTypeDocument: Document|undefined = this.resourcesState.getSelectedOperationTypeDocument();
        if (!selectedMainTypeDocument || !selectedMainTypeDocument.resource.id) return;

        this.viewManager.setNavigationPath(selectedMainTypeDocument.resource.id, navigationPath);

        await this.populateDocumentList();
        this.deselectIfNotInList();
    }


    private removeFromListOfNewDocumentsFromRemote(document: Document) { // TODO make generic static method

        let index = this.newDocumentsFromRemote.indexOf(document);
        if (index > -1) this.newDocumentsFromRemote.splice(index, 1);
    }


    public deselect() {

        if (!this.selectedDocument) return;

        const deselectedDocument: Document = this.selectedDocument;
        this.selectedDocument = undefined;

        this.removeEmptyDocuments();
        this.resourcesState.setActiveDocumentViewTab(undefined);
        this.notifyDeselectionObservers(deselectedDocument);
    }


    public setSelectedById(resourceId: string) {

        return this.datastore.get(resourceId).then(
            document => {
                return this.setSelected(document);
            }
        );
    }


    public async setSelected(documentToSelect: Document): Promise<any|undefined> {

        if (!this.resourcesState.isInOverview() &&
                documentToSelect == this.resourcesState.getSelectedOperationTypeDocument()) {
            return Promise.resolve(undefined);
        }

        if (documentToSelect == this.selectedDocument) return Promise.resolve(undefined);

        if (!documentToSelect) this.resourcesState.setActiveDocumentViewTab(undefined);

        if (this.selectedDocument) this.notifyDeselectionObservers(this.selectedDocument);

        this.selectedDocument = documentToSelect;

        this.removeEmptyDocuments();
        if (documentToSelect && documentToSelect.resource && !documentToSelect.resource.id &&
            documentToSelect.resource.type != this.viewManager.getViewType()) {

            this.documents.unshift(documentToSelect);
        }

        if (this.isNewDocumentFromRemote(documentToSelect)) {
            this.removeFromListOfNewDocumentsFromRemote(documentToSelect);
        }

        const result1 = this.mainTypeDocumentsManager.
            selectLinkedOperationTypeDocumentForSelectedDocument(this.selectedDocument);
        const result2 = await this.adjustQuerySettingsIfNecessary();

        let promise = Promise.resolve();
        if (result1 || result2) promise = this.populateDocumentList();

        return promise;
    }


    public deselectionNotifications(): Observable<Document> {

        return Observable.create((observer: Observer<Document>) => {
            this.deselectionObservers.push(observer);
        })
    }


    private notifyDeselectionObservers(deselectedDocument: Document) {

        if (this.deselectionObservers) {
            this.deselectionObservers.forEach(
                (observer: Observer<Document>) => observer.next(deselectedDocument)
            );
        }
    }


    private async handleChange(changedDocument: Document) {

        if (!changedDocument || !this.documents) return;
        if (DocumentsManager.isExistingDoc(changedDocument, this.documents)) return;

        if (changedDocument.resource.type == this.viewManager.getViewType()) {
            return this.mainTypeDocumentsManager.populate();
        }

        let oldDocuments = this.documents;
        await this.populateDocumentList();

        for (let document of this.documents) {
            const conflictedRevisions: Array<Document>
                = await this.datastore.getConflictedRevisions(document.resource.id as string);

            if (oldDocuments.indexOf(document) == -1 && ChangeHistoryUtil.isRemoteChange(document, conflictedRevisions,
                    this.settingsService.getUsername())) {
                this.newDocumentsFromRemote.push(document);
            }
        }
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    public populateDocumentList() {

        this.newDocumentsFromRemote = [];
        this.documents = [];

        let isRecordedInTarget;
        if (this.resourcesState.isInOverview()) {
            isRecordedInTarget = this.projectDocument;
        } else {
            if (!this.resourcesState.getSelectedOperationTypeDocument()) {
                return Promise.resolve();
            }
            isRecordedInTarget = this.resourcesState.getSelectedOperationTypeDocument();
        }
        if (!isRecordedInTarget) return Promise.reject('no isRecordedInTarget in populate doc list');
        if (!isRecordedInTarget.resource.id) return Promise.reject('no id in populate doc list');

        return this.fetchDocuments(DocumentsManager.makeDocsQuery(
            this.buildQuery(), isRecordedInTarget.resource.id))
            .then(documents => {
                this.documents = documents
            })
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

        if (!document) return false;

        return this.newDocumentsFromRemote.indexOf(document) > -1;
    }


    /**
     * @returns {boolean} true if list needs to be reloaded afterwards
     */
    public async adjustQuerySettingsIfNecessary(): Promise<boolean> {

        if (!this.selectedDocument) return false;

        if (!ModelUtil.isInList(this.selectedDocument, this.documents)) {
            this.resourcesState.setQueryString('');
            this.viewManager.setFilterTypes(undefined);
            await this.createNavigationPathForDocument(this.selectedDocument);
            return true;
        }

        return false;
    }


    private deselectIfNotInList() {

        if (this.selectedDocument && !ModelUtil.isInList(this.selectedDocument, this.documents)) {
            this.deselect();
        }
    }


    private fetchDocuments(query: Query): Promise<any> {

        return this.datastore.find(query as any)
            .then(result => result.documents)
            .catch(errWithParams => DocumentsManager.handleFindErr(errWithParams, query));
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length == 2) console.error('Error with find. Cause:', errWithParams[1]);
    }


    private buildQuery(): Query {

        let constraints: any = {};

        if (this.resourcesState.getNavigationPath() &&
            (this.resourcesState.getNavigationPath() as any).rootDocument
        ){
            constraints['liesWithin:contain'] = (this.resourcesState.getNavigationPath() as any).rootDocument.resource.id;
        } else {
            constraints['liesWithin:exist'] = 'UNKNOWN';
        }

        let query: Query = {
            q: this.resourcesState.getQueryString(),
            constraints: constraints
        };

        if (this.resourcesState.getTypeFilters()) query.types = this.resourcesState.getTypeFilters();

        return query
    }


    private static isExistingDoc(changedDocument: Document, documents: Array<Document>): boolean {

        for (let doc of documents) {
            if (!doc.resource || !changedDocument.resource) continue;
            if (!doc.resource.id || !changedDocument.resource.id) continue;
            if (doc.resource.id == changedDocument.resource.id) return true;
        }

        return false;
    }


    private static makeDocsQuery(query: Query, mainTypeDocumentResourceId: string): Query {

        const clonedQuery = JSON.parse(JSON.stringify(query));

        if (!clonedQuery.constraints) clonedQuery.constraints = {};
        clonedQuery.constraints['isRecordedIn:contain'] = mainTypeDocumentResourceId;

        return clonedQuery;
    }


    private async createNavigationPathForDocument(document: Document) {

        const mainTypeDocument: Document|undefined = this.resourcesState.getSelectedOperationTypeDocument();
        if (!mainTypeDocument) return;

        await this.viewManager.createNavigationPathForDocument(document as IdaiFieldDocument,
            mainTypeDocument.resource.id as string);
    }
}
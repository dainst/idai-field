import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {Query} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {MainTypeDocumentsManager} from './main-type-documents-manager';
import {NavigationPathManager} from './navigation-path-manager';
import {SettingsService} from '../../../core/settings/settings-service';
import {ChangeHistoryUtil} from '../../../core/model/change-history-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {ChangesStream} from '../../../core/datastore/core/changes-stream';
import {ModelUtil} from '../../../core/model/model-util';
import {ResourcesState} from './resources-state';
import {remove} from '../../../util/list-util';


/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DocumentsManager {

    public projectDocument: Document;
    private selectedDocument: IdaiFieldDocument|undefined;
    private documents: Array<Document>;
    private newDocumentsFromRemote: Array<Document> = [];

    private deselectionObservers: Array<Observer<Document>> = [];


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private changesStream: ChangesStream,
        private settingsService: SettingsService,
        private navigationPathManager: NavigationPathManager,
        private mainTypeDocumentsManager: MainTypeDocumentsManager,
        private resourcesState: ResourcesState
    ) {

        changesStream.remoteChangesNotifications().
            subscribe(changedDocument => this.handleChange(changedDocument));
    }


    public getDocuments = () => this.documents;

    public getSelectedDocument = () => this.selectedDocument;


    public async populateProjectDocument() {

        try {
            this.projectDocument = await this.datastore.get(this.settingsService.getSelectedProject() as any);
        } catch (_) {
            console.log('cannot find project document')
        }
    }


    public async setQueryString(q: string) {

        this.resourcesState.setQueryString(q);

        await this.populateDocumentList();
        this.deselectIfNotInList();
    }


    public async setTypeFilters(types: string[]) {

        this.resourcesState.setTypeFilters(types);

        await this.populateDocumentList();
        this.deselectIfNotInList();
    }


    public async moveInto(document: IdaiFieldDocument|undefined) {

        this.navigationPathManager.moveInto(document);

        await this.populateDocumentList();
        this.deselectIfNotInList();
    }


    private removeFromList(document: Document, docs: Array<Document>) {

        if (!this.isNewDocumentFromRemote(document)) return;

        let index = docs.indexOf(document);
        if (index > -1) docs.splice(index, 1);
    }


    public async setSelectedById(resourceId: string) {

        await this.setSelected(await this.datastore.get(resourceId));
    }


    public deselect() {

        if (!this.selectedDocument) return;

        const deselectedDocument: Document = this.selectedDocument;
        this.selectedDocument = undefined;

        this.removeEmpty(this.documents);
        this.resourcesState.setActiveDocumentViewTab(undefined);
        this.notifyDeselectionObservers(deselectedDocument);
    }


    public addNewDocument(document: IdaiFieldDocument) {

        this.documents.unshift(document);
        this.selectAndNotify(document);
    }


    private selectAndNotify(document: IdaiFieldDocument) {

        if (this.selectedDocument) this.notifyDeselectionObservers(this.selectedDocument);
        this.selectedDocument = document;
    }


    public async setSelected(document: IdaiFieldDocument): Promise<any> {

        if (!document) return this.deselect(); // TODO make sure clients call deselect
        if (document == this.selectedDocument) return;

        this.selectAndNotify(document);

        this.removeEmpty(this.documents); // TODO work with list util method, that takes a predicate like isEmpty which is defined for document
        remove(this.newDocumentsFromRemote, document);

        // TODO extract method
        if (!ModelUtil.isInList(document, await this.createUpdatedDocumentList())) { // TODO use list util
            await this.makeSureSelectedDocumentAppearsInList();
            await this.populateDocumentList();
        }
    }


    public deselectionNotifications(): Observable<Document> {

        return Observable.create((observer: Observer<Document>) => {
            this.deselectionObservers.push(observer);
        })
    }


    private notifyDeselectionObservers(deselectedDocument: Document) {

        if (!this.deselectionObservers) return;

        this.deselectionObservers.forEach(
            (observer: Observer<Document>) => observer.next(deselectedDocument)
        );
    }


    private async handleChange(changedDocument: Document) {

        if (!changedDocument || !this.documents) return;
        if (DocumentsManager.isExistingDoc(changedDocument, this.documents)) return;

        if (changedDocument.resource.type == this.resourcesState.getViewType()) {
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


    public async populateDocumentList() {

        this.newDocumentsFromRemote = [];
        this.documents = await this.createUpdatedDocumentList();
    }


    public async createUpdatedDocumentList(): Promise<Array<Document>> {

        const isRecordedInTarget: Document|undefined = await this.makeIsRecordedInTarget();
        if (!isRecordedInTarget) return [];

        const documents: Array<Document> = await this.fetchDocuments(
            DocumentsManager.makeDocsQuery(this.buildQuery(), isRecordedInTarget.resource.id as string)
        );

        return this.removeEmpty(documents);
    }


    private async makeIsRecordedInTarget(): Promise<Document|undefined> {

        let isRecordedInTarget;
        if (this.resourcesState.isInOverview()) {
            isRecordedInTarget = this.projectDocument;
        } else {
            if (!this.resourcesState.getMainTypeDocument()) return; // TODO get rid of this line and use ternary operator
            isRecordedInTarget = this.resourcesState.getMainTypeDocument();
        }
        if (!isRecordedInTarget) throw 'no isRecordedInTarget in populate doc list';
        if (!isRecordedInTarget.resource.id) throw 'no id in populate doc list';

        return isRecordedInTarget;
    }


    private removeEmpty(documents: Array<Document>) {

        for (let document of documents) {
            if (!document.resource.id) this.remove(document, documents);
        }
        return documents;
    }


    // TODO replace with call to method from list util
    public remove(document: Document, documents: Array<Document> = this.documents) {

        documents.splice(documents.indexOf(document), 1);
    }


    public isNewDocumentFromRemote(document: Document): boolean {

        return (!document)
            ? false
            : this.newDocumentsFromRemote.indexOf(document) > -1;
    }


    private async makeSureSelectedDocumentAppearsInList() {

        this.mainTypeDocumentsManager
            .selectLinkedOperationTypeDocumentForSelectedDocument(this.selectedDocument);

        await this.navigationPathManager
            .updateNavigationPathForDocument(this.selectedDocument as IdaiFieldDocument);

        await this.adjustQuerySettingsIfNecessary();
    }


    private async adjustQuerySettingsIfNecessary() {

        const documents: Array<Document> = await this.createUpdatedDocumentList();

        if (!ModelUtil.isInList(this.selectedDocument as IdaiFieldDocument, documents)) {
            this.resourcesState.setQueryString('');
            this.resourcesState.setTypeFilters(undefined as any);
        }
    }


    private deselectIfNotInList() {

        if (!this.selectedDocument) return;
        if (!ModelUtil.isInList(this.selectedDocument, this.documents)) this.deselect();
    }


    private async fetchDocuments(query: Query): Promise<any> {

        try {
            const result = await this.datastore.find(query);
            return result.documents;
        } catch (errWithParams) {
            DocumentsManager.handleFindErr(errWithParams, query);
        }
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length == 2) console.error('Error with find. Cause:', errWithParams[1]);
    }


    private buildQuery(): Query {

        const query: Query = {
            q: this.resourcesState.getQueryString(),
            constraints: this.buildConstraints()
        };

        if (this.resourcesState.getTypeFilters()) {
            query.types = this.resourcesState.getTypeFilters();
        }

        return query;
    }


    private buildConstraints(): { [name: string]: string}  {

        const rootDoc = this.resourcesState.getNavigationPath().rootDocument;
        return rootDoc
            ? { 'liesWithin:contain': rootDoc.resource.id as string }
            : { 'liesWithin:exist': 'UNKNOWN' }
    }


    private static isExistingDoc(changedDocument: Document, documents: Array<Document>): boolean {

        for (let doc of documents) { // TODO rewrite with some
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
}
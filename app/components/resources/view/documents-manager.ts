import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {Document, Query} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {OperationTypeDocumentsManager} from './operation-type-documents-manager';
import {NavigationPathManager} from './navigation-path-manager';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {RemoteChangesStream} from '../../../core/datastore/core/remote-changes-stream';
import {ObserverUtil} from '../../../util/observer-util';
import {Loading} from '../../../widgets/loading';
import {hasEqualId, hasId} from '../../../core/model/model-util';
import {subtract, unique} from 'tsfun';
import {ResourcesStateManager} from './resources-state-manager';
import {IdaiFieldFindResult} from '../../../core/datastore/core/cached-read-datastore';


/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DocumentsManager {

    private documents: Array<Document>;
    private newDocumentsFromRemote: Array<string /* resourceId */> = [];

    private totalDocumentCount: number;

    private deselectionObservers: Array<Observer<Document>> = [];
    private populateDocumentsObservers: Array<Observer<Array<Document>>> = [];

    private static documentLimit: number = 200;


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private remoteChangesStream: RemoteChangesStream,
        private navigationPathManager: NavigationPathManager,
        private operationTypeDocumentsManager: OperationTypeDocumentsManager,
        private resourcesState: ResourcesStateManager,
        private loading: Loading
    ) {
        remoteChangesStream.notifications().subscribe(document => this.handleChange(document));
    }


    public getDocuments = () => this.documents;

    public getSelectedDocument = () => this.resourcesState.getSelectedDocument();

    public getTotalDocumentCount = () => this.totalDocumentCount;

    public removeFromDocuments = (document: Document) => this.documents = subtract([document])(this.documents);

    public deselectionNotifications = (): Observable<Document> => ObserverUtil.register(this.deselectionObservers);

    public populateDocumentsNotifactions = (): Observable<Array<Document>> =>
        ObserverUtil.register(this.populateDocumentsObservers);


    public isNewDocumentFromRemote = (document: Document) => {

        if (!document.resource.id) return false;
        return this.newDocumentsFromRemote.includes(document.resource.id);
    };


    public async setQueryString(q: string) {

        this.resourcesState.setQueryString(q);
        await this.populateAndDeselectIfNecessary();
    }


    public async setTypeFilters(types: string[]) {

        this.resourcesState.setTypeFilters(types);
        await this.populateAndDeselectIfNecessary();
    }


    public async setDisplayHierarchy(displayHierarchy: boolean) {

        this.navigationPathManager.setDisplayHierarchy(displayHierarchy);
        await this.populateAndDeselectIfNecessary();
    }


    public async setBybassOperationTypeSelection(bypassOperationTypeSelection: boolean) {

        this.navigationPathManager.setBypassOperationTypeSelection(bypassOperationTypeSelection);
        await this.populateAndDeselectIfNecessary();
    }


    public async moveInto(document: IdaiFieldDocument|undefined) {

        await this.navigationPathManager.moveInto(document);
        await this.populateAndDeselectIfNecessary();
    }


    public deselect() {

        if (this.resourcesState.getSelectedDocument()) {

            this.selectAndNotify(undefined);
            this.documents = this.documents.filter(hasId);
            this.resourcesState.setActiveDocumentViewTab(undefined);
        }
    }


    public addNewDocument(document: IdaiFieldDocument) {

        this.documents.unshift(document);
        this.selectAndNotify(document);
    }


    public async setSelected(documentToSelect: IdaiFieldDocument): Promise<any> {

        this.documents = this.documents.filter(hasId);

        if (documentToSelect.resource.id) {
            this.newDocumentsFromRemote =
                subtract([documentToSelect.resource.id])(this.newDocumentsFromRemote);
        }

        if (!(await this.createUpdatedDocumentList()).documents.find(hasEqualId(documentToSelect))) {

            if (documentToSelect) {
                await this.makeSureSelectedDocumentAppearsInList(documentToSelect);
            } else {
                console.error('documentToSelect undefined in setSelected'); // see #8317
            }
            await this.populateDocumentList();
        }

        this.selectAndNotify(documentToSelect);
    }


    private selectAndNotify(document: IdaiFieldDocument|undefined) {

        if (this.resourcesState.getSelectedDocument()) {
            ObserverUtil.notify(this.deselectionObservers,
                this.resourcesState.getSelectedDocument() as Document|undefined);
        }
        this.resourcesState.setSelectedDocument(document);
    }


    private async populateAndDeselectIfNecessary() {

        await this.populateDocumentList();
        if (!this.documents.find(hasEqualId(this.resourcesState.getSelectedDocument()))) this.deselect();
    }


    private async handleChange(changedDocument: Document) {

        if (!this.documents) return;
        if (this.documents.find(hasEqualId(changedDocument))) return;

        if (changedDocument.resource.type == this.resourcesState.getViewType()) {
            return this.operationTypeDocumentsManager.populate();
        }

        this.newDocumentsFromRemote = unique(this.newDocumentsFromRemote.concat([changedDocument.resource.id]));
        await this.populateDocumentList(true);
    }


    public async populateDocumentList(skipResetRemoteDocs = false) {

        this.loading.start();

        if (!skipResetRemoteDocs) this.newDocumentsFromRemote = [];
        this.documents = [];

        const result: IdaiFieldFindResult<IdaiFieldDocument> = await this.createUpdatedDocumentList();
        this.documents = result.documents;
        this.totalDocumentCount = result.totalCount;

        this.loading.stop();
        ObserverUtil.notify(this.populateDocumentsObservers, this.documents);
    }


    public async createUpdatedDocumentList(): Promise<IdaiFieldFindResult<IdaiFieldDocument>> {

        const isRecordedInTarget = this.makeIsRecordedInTarget();
        if (!isRecordedInTarget && !this.resourcesState.isInOverview()) {
            return { documents: [], totalCount: 0 };
        }

        const docsQuery = this.makeDocsQuery(isRecordedInTarget);
        return (await this.fetchDocuments(docsQuery));
    }


    private makeIsRecordedInTarget(): string|undefined {

        return this.resourcesState.isInOverview()
            ? undefined
            : this.resourcesState.getMainTypeDocumentResourceId()
                ? this.resourcesState.getMainTypeDocumentResourceId()
                : undefined;
    }


    private async makeSureSelectedDocumentAppearsInList(documentToSelect: IdaiFieldDocument) {

        this.operationTypeDocumentsManager
            .selectLinkedOperationTypeDocumentForSelectedDocument(documentToSelect);

        await this.navigationPathManager.updateNavigationPathForDocument(documentToSelect);

        await this.adjustQuerySettingsIfNecessary(documentToSelect);
    }


    private async adjustQuerySettingsIfNecessary(documentToSelect: Document) {

        if (!(await this.updatedDocumentListContainsSelectedDocument(documentToSelect))) {

            this.resourcesState.setQueryString('');
            this.resourcesState.setTypeFilters([]);
        }
    }


    private async updatedDocumentListContainsSelectedDocument(documentToSelect: Document) {

        return (await this.createUpdatedDocumentList()).documents.find(hasEqualId(documentToSelect));
    }


    private makeDocsQuery(mainTypeDocumentResourceId: string|undefined): Query {

        const q: Query = {
            q: this.resourcesState.getQueryString(),
            constraints: this.makeConstraints(mainTypeDocumentResourceId),
            types: (this.resourcesState.getTypeFilters().length > 0)
                ? this.resourcesState.getTypeFilters()
                : undefined
        };

        if (!mainTypeDocumentResourceId
            && this.resourcesState.isInOverview()
            && !q.types) {

            q.types = this.resourcesState.getOverviewTypeNames();
        }

        if (!this.resourcesState.getDisplayHierarchy()) q.limit = DocumentsManager.documentLimit;

        return q;
    }


    private async fetchDocuments(query: Query): Promise<IdaiFieldFindResult<IdaiFieldDocument>> {

        try {
            return this.datastore.find(query);
        } catch (errWithParams) {
            DocumentsManager.handleFindErr(errWithParams, query);
            return { documents: [], totalCount: 0 };
        }
    }


    private makeConstraints(mainTypeDocumentResourceId: string|undefined)
            : { [name: string]: string|string[]}  {

        const navigationPath = this.navigationPathManager.getNavigationPath();

        const constraints: { [name: string]: string|string[] } = !this.resourcesState.getDisplayHierarchy()
            ? {}
            : navigationPath.selectedSegmentId
                ? { 'liesWithin:contain': navigationPath.selectedSegmentId }
                : { 'liesWithin:exist': 'UNKNOWN' };

        if (mainTypeDocumentResourceId) {
            constraints['isRecordedIn:contain']
                = this.getIsRecordedInConstraintValues(mainTypeDocumentResourceId);
        }

        return constraints;
    }


    private getIsRecordedInConstraintValues(mainTypeDocumentResourceId: string): string|string[] {

        return this.resourcesState.getBypassOperationTypeSelection()
            && !this.resourcesState.getDisplayHierarchy()
        ? this.operationTypeDocumentsManager.getDocuments().map(document => document.resource.id)
        : mainTypeDocumentResourceId;
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length === 2) console.error('Error with find. Cause:', errWithParams[1]);
    }
}
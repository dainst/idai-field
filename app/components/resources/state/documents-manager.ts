import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {Document, Query} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {OperationTypeDocumentsManager} from './operation-type-documents-manager';
import {NavigationPathManager} from './navigation-path-manager';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {RemoteChangesStream} from '../../../core/datastore/core/remote-changes-stream';
import {ResourcesState} from './resources-state';
import {ObserverUtil} from '../../../util/observer-util';
import {Loading} from '../../../widgets/loading';
import {hasEqualId, hasId} from '../../../core/model/model-util';
import {subtract, unique} from 'tsfun';
import {NavigationPathOut} from './navigation-path-base';


/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DocumentsManager {

    private documents: Array<Document>;
    private newDocumentsFromRemote: Array<string /* resourceId */> = [];

    private deselectionObservers: Array<Observer<Document>> = [];
    private populateDocumentsObservers: Array<Observer<Array<Document>>> = [];


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private remoteChangesStream: RemoteChangesStream,
        private navigationPathManager: NavigationPathManager,
        private mainTypeDocumentsManager: OperationTypeDocumentsManager,
        private resourcesState: ResourcesState,
        private loading: Loading
    ) {
        remoteChangesStream.notifications().subscribe(document => this.handleChange(document));
    }


    public getDocuments = () => this.documents;

    public getSelectedDocument = () => this.resourcesState.getSelectedDocument();

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

        if (!(await this.createUpdatedDocumentList()).find(hasEqualId(documentToSelect))) {

            if (documentToSelect) {
                await this.makeSureSelectedDocumentAppearsInList(documentToSelect);
            } else {
                console.error("documentToSelect undefined in setSelected"); // see #8317
            }
            await this.populateDocumentList();
        }
        this.selectAndNotify(documentToSelect);
    }


    private selectAndNotify(document: IdaiFieldDocument|undefined) {

        if (this.resourcesState.getSelectedDocument()) {
            ObserverUtil.notify(this.deselectionObservers, this.resourcesState.getSelectedDocument());
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
            return this.mainTypeDocumentsManager.populate();
        }

        this.newDocumentsFromRemote = unique(this.newDocumentsFromRemote.concat([changedDocument.resource.id]));
        await this.populateDocumentList(true);
    }


    public async populateDocumentList(skipResetRemoteDocs = false) {

        this.loading.start();

        if (!skipResetRemoteDocs) this.newDocumentsFromRemote = [];
        this.documents = [];
        this.documents = await this.createUpdatedDocumentList();

        this.loading.stop();
        ObserverUtil.notify(this.populateDocumentsObservers, this.documents);
    }


    public async createUpdatedDocumentList(): Promise<Array<Document>> {

        const isRecordedInTarget = this.makeIsRecordedInTarget();
        if (!isRecordedInTarget && !this.resourcesState.isInOverview()) return [];

        const docsQuery = this.makeDocsQuery(isRecordedInTarget);
        return (await this.fetchDocuments(docsQuery)).filter(hasId);
    }


    private makeIsRecordedInTarget(): string|undefined {

        return this.resourcesState.isInOverview()
            ? undefined
            : this.resourcesState.getMainTypeDocumentResourceId()
                ? this.resourcesState.getMainTypeDocumentResourceId()
                : undefined;
    }


    private async makeSureSelectedDocumentAppearsInList(documentToSelect: IdaiFieldDocument) {

        this.mainTypeDocumentsManager
            .selectLinkedOperationTypeDocumentForSelectedDocument(documentToSelect);

        await this.navigationPathManager
            .updateNavigationPathForDocument(documentToSelect);

        await this.adjustQuerySettingsIfNecessary(documentToSelect);
    }


    private async adjustQuerySettingsIfNecessary(documentToSelect: Document) {

        if (!(await this.updatedDocumentListContainsSelectedDocument(documentToSelect))) {

            this.resourcesState.setQueryString('');
            this.resourcesState.setTypeFilters([]);
        }
    }


    private async updatedDocumentListContainsSelectedDocument(documentToSelect: Document) {

        return (await this.createUpdatedDocumentList())
            .find(hasEqualId(documentToSelect))
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

        return q;
    }


    private async fetchDocuments(query: Query): Promise<Document[]> {

        try {
            return (await this.datastore.find(query)).documents;
        } catch (errWithParams) {
            DocumentsManager.handleFindErr(errWithParams, query);
            return [];
        }
    }


    private makeConstraints(mainTypeDocumentResourceId: string|undefined): { [name: string]: string}  {

        const navigationPath: NavigationPathOut = this.navigationPathManager.getNavigationPath();

        const selectedSegmentDoc = navigationPath.segments
            .find(_ => _.resource.id === navigationPath.selectedSegmentId);

        const constraints: { [name: string]: string} = !this.resourcesState.getDisplayHierarchy()
            ? {}
            : selectedSegmentDoc
                ? { 'liesWithin:contain': selectedSegmentDoc.resource.id }
                : { 'liesWithin:exist': 'UNKNOWN' };

        if (mainTypeDocumentResourceId) {
            constraints['isRecordedIn:contain'] = mainTypeDocumentResourceId;
        }

        return constraints;
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length === 2) console.error('Error with find. Cause:', errWithParams[1]);
    }
}
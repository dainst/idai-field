import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable';
import {Document, Query} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {OperationsManager} from './operations-manager';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {RemoteChangesStream} from '../../../core/datastore/core/remote-changes-stream';
import {ObserverUtil} from '../../../util/observer-util';
import {Loading} from '../../../widgets/loading';
import {hasEqualId, hasId} from '../../../core/model/model-util';
import {subtract, unique, jsonClone} from 'tsfun';
import {ResourcesStateManager} from './resources-state-manager';
import {IdaiFieldFindResult} from '../../../core/datastore/core/cached-read-datastore';
import {ResourcesState} from './state/resources-state';


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
        private operationTypeDocumentsManager: OperationsManager,
        private resourcesStateManager: ResourcesStateManager,
        private loading: Loading
    ) {
        remoteChangesStream.notifications().subscribe(document => this.handleRemoteChange(document));
    }


    public getDocuments = () => this.documents;

    public getTotalDocumentCount = () => this.totalDocumentCount;

    public deselectionNotifications = (): Observable<Document> => ObserverUtil.register(this.deselectionObservers);

    public populateDocumentsNotifactions = (): Observable<Array<Document>> =>
        ObserverUtil.register(this.populateDocumentsObservers);


    public isNewDocumentFromRemote(document: Document): boolean {

        if (!document.resource.id) return false;
        return this.newDocumentsFromRemote.includes(document.resource.id);
    }


    public async setQueryString(q: string, populate: boolean = true) {

        this.resourcesStateManager.setQueryString(q);
        if (populate) await this.populateAndDeselectIfNecessary();
    }


    public async setTypeFilters(types: string[]) {

        this.resourcesStateManager.setTypeFilters(types);
        this.resourcesStateManager.setCustomConstraints({});
        await this.populateAndDeselectIfNecessary();
    }


    public async setCustomConstraints(constraints: { [name: string]: string}) {

        this.resourcesStateManager.setCustomConstraints(constraints);
        await this.populateAndDeselectIfNecessary();
    }


    public async setBypassHierarchy(bypassHierarchy: boolean) {

        this.resourcesStateManager.setBypassHierarchy(bypassHierarchy);
        await this.populateAndDeselectIfNecessary();
    }


    public async setSelectAllOperationsOnBypassHierarchy(selectAllOperationsOnBypassHierarchy: boolean) {

        this.resourcesStateManager.setSelectAllOperationsOnBypassHierarchy(selectAllOperationsOnBypassHierarchy);
        await this.populateAndDeselectIfNecessary();
    }


    public async moveInto(document: IdaiFieldDocument|undefined) {

        await this.resourcesStateManager.moveInto(document);
        await this.populateAndDeselectIfNecessary();
    }


    public deselect() {

        if (ResourcesState.getSelectedDocument(this.resourcesStateManager.get())) {

            this.selectAndNotify(undefined);
            this.documents = this.documents.filter(hasId);
            this.resourcesStateManager.setActiveDocumentViewTab(undefined);
        }
    }


    public addNewDocument(document: IdaiFieldDocument) {

        this.documents.unshift(document);
        this.selectAndNotify(document);
    }


    public async setSelected(resourceId: string): Promise<any> {

        this.documents = this.documents.filter(hasId);

        try {
            const documentToSelect = await this.datastore.get(resourceId);

            this.newDocumentsFromRemote = subtract([documentToSelect.resource.id])(this.newDocumentsFromRemote);

            if (!(await this.createUpdatedDocumentList()).documents.find(hasEqualId(documentToSelect))) {

                await this.makeSureSelectedDocumentAppearsInList(documentToSelect);
                await this.populateDocumentList();
            }

            this.selectAndNotify(documentToSelect);

        } catch (e) {
            console.error('documentToSelect undefined in DocumentsManager.setSelected()');
        }
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
        if (!isRecordedInTarget && !this.resourcesStateManager.isInOverview()) {
            return { documents: [], totalCount: 0 };
        }

        const state = this.resourcesStateManager.get();

        const isRecordedInTargetIdOrIds = DocumentsManager.chooseIsRecordedInTargetIdOrIds(isRecordedInTarget,
            () => this.operationTypeDocumentsManager.getDocuments().map(document => document.resource.id),
            ResourcesState.getBypassHierarchy(state),
            ResourcesState.getSelectAllOperationsOnBypassHierarchy(state));

        return (await this.fetchDocuments(
                DocumentsManager.buildQuery(
                    isRecordedInTargetIdOrIds,
                    state,
                    this.resourcesStateManager.isInOverview(),
                    this.resourcesStateManager.getOverviewTypeNames()))
        );
    }


    private selectAndNotify(document: IdaiFieldDocument|undefined) {

        if (ResourcesState.getSelectedDocument(this.resourcesStateManager.get())) {
            ObserverUtil.notify(this.deselectionObservers,
                ResourcesState.getSelectedDocument(this.resourcesStateManager.get()) as Document|undefined);
        }
        this.resourcesStateManager.setSelectedDocument(document);
    }


    private async populateAndDeselectIfNecessary() {

        await this.populateDocumentList();
        if (!this.documents.find(hasEqualId(ResourcesState.getSelectedDocument(this.resourcesStateManager.get())))) this.deselect();
    }


    private async handleRemoteChange(changedDocument: Document) {

        if (!this.documents) return;
        if (this.documents.find(hasEqualId(changedDocument))) return;

        if (changedDocument.resource.type == this.resourcesStateManager.getViewType()) {
            return this.operationTypeDocumentsManager.populate();
        }

        this.newDocumentsFromRemote = unique(this.newDocumentsFromRemote.concat([changedDocument.resource.id]));
        await this.populateDocumentList(true);
    }


    private makeIsRecordedInTarget(): string|undefined {

        return this.resourcesStateManager.isInOverview()
            ? undefined
            : ResourcesState.getMainTypeDocumentResourceId(this.resourcesStateManager.get());
    }


    private async makeSureSelectedDocumentAppearsInList(documentToSelect: IdaiFieldDocument) {

        this.operationTypeDocumentsManager.selectLinkedOperationForSelectedDocument(documentToSelect);
        await this.resourcesStateManager.updateNavigationPathForDocument(documentToSelect);
        await this.adjustQuerySettingsIfNecessary(documentToSelect);
    }


    private async adjustQuerySettingsIfNecessary(documentToSelect: Document) {

        if (!(await this.updatedDocumentListContainsSelectedDocument(documentToSelect))) {

            this.resourcesStateManager.setQueryString('');
            this.resourcesStateManager.setTypeFilters([]);
            this.resourcesStateManager.setCustomConstraints({});
        }
    }


    private async updatedDocumentListContainsSelectedDocument(documentToSelect: Document) {

        return (await this.createUpdatedDocumentList()).documents.find(hasEqualId(documentToSelect));
    }


    private async fetchDocuments(query: Query): Promise<IdaiFieldFindResult<IdaiFieldDocument>> {

        try {
            return await this.datastore.find(query);
        } catch (errWithParams) {
            DocumentsManager.handleFindErr(errWithParams, query);
            return { documents: [], totalCount: 0 };
        }
    }


    private static chooseIsRecordedInTargetIdOrIds(
        mainTypeDocumentResourceId: string|undefined,
        operationTypeDocumentIds: () => string[],
        bypassHierarchy: boolean,
        selectAllOperationsOnBypassHierarchy: boolean): string|string[]|undefined {

        if (!mainTypeDocumentResourceId) return undefined;

        return bypassHierarchy && selectAllOperationsOnBypassHierarchy
            ? operationTypeDocumentIds()
            : mainTypeDocumentResourceId;
    }


    private static buildQuery(
        isRecordedInTargetIdOrIds: string|string[]|undefined,
        state: ResourcesState,
        isInOverview: boolean,
        overviewTypeNames: string[]
    ): Query {

        const bypassHierarchy = ResourcesState.getBypassHierarchy(state);
        const typeFilters = ResourcesState.getTypeFilters(state);
        const customConstraints = ResourcesState.getCustomConstraints(state);

        return {
            q: ResourcesState.getQueryString(state),

            constraints: DocumentsManager.buildConstraints(
                customConstraints,
                isRecordedInTargetIdOrIds,
                ResourcesState.getNavigationPath(state).selectedSegmentId,
                !bypassHierarchy),

            types: (typeFilters.length > 0)
                ? typeFilters
                : !isRecordedInTargetIdOrIds && isInOverview && !bypassHierarchy
                    ? overviewTypeNames
                    : undefined,

            limit: bypassHierarchy ? DocumentsManager.documentLimit : undefined
        };
    }


    private static buildConstraints(customConstraints: { [name: string]: string },
                                    isRecordedInIdOrIds: string|string[]|undefined,
                                    liesWithinId: string|undefined,
                                    addLiesWithinConstraints: boolean): { [name: string]: string|string[]} {

        const constraints: { [name: string]: string|string[] } = jsonClone(customConstraints) as any;

        if (addLiesWithinConstraints) {
            if (liesWithinId) {
                constraints['liesWithin:contain'] = liesWithinId;
            } else {
                constraints['liesWithin:exist'] = 'UNKNOWN';
            }
        }

        if (isRecordedInIdOrIds) constraints['isRecordedIn:contain'] = isRecordedInIdOrIds;

        return constraints;
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length === 2) console.error('Error with find. Cause:', errWithParams[1]);
    }
}
import {Observer, Observable} from 'rxjs';
import {subtract, unique, jsonClone} from 'tsfun';
import {Document, Query, IdaiFieldDocument} from 'idai-components-2';
import {OperationsManager} from './operations-manager';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {RemoteChangesStream} from '../../../core/datastore/core/remote-changes-stream';
import {ObserverUtil} from '../../../core/util/observer-util';
import {Loading} from '../../../widgets/loading';
import {hasEqualId, hasId} from '../../../core/model/model-util';
import {ResourcesStateManager} from './resources-state-manager';
import {IdaiFieldFindResult} from '../../../core/datastore/core/cached-read-datastore';
import {ResourcesState} from './state/resources-state';
import {IndexFacade} from '../../../core/datastore/index/index-facade';


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
    private documentChangedFromRemoteObservers: Array<Observer<undefined>> = [];
    private childrenCountMap: { [resourceId: string]: number } = {};

    private currentQueryId: string;

    private static documentLimit: number = 200;


    constructor(
        private datastore: FieldReadDatastore,
        private remoteChangesStream: RemoteChangesStream,
        private operationTypeDocumentsManager: OperationsManager,
        private resourcesStateManager: ResourcesStateManager,
        private loading: Loading,
        private indexFacade: IndexFacade
    ) {
        remoteChangesStream.notifications().subscribe(document => this.handleRemoteChange(document));
    }


    public getDocuments = () => this.documents;

    public getTotalDocumentCount = () => this.totalDocumentCount;

    public getChildrenCount = (document: IdaiFieldDocument) => this.childrenCountMap[document.resource.id];

    public deselectionNotifications = (): Observable<Document> =>
        ObserverUtil.register(this.deselectionObservers);

    public populateDocumentsNotifactions = (): Observable<Array<Document>> =>
        ObserverUtil.register(this.populateDocumentsObservers);

    public documentChangedFromRemoteNotifications = (): Observable<undefined> =>
        ObserverUtil.register(this.documentChangedFromRemoteObservers);


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
            this.removeNewDocument();
            this.resourcesStateManager.setActiveDocumentViewTab(undefined);
        }
    }


    public addNewDocument(document: IdaiFieldDocument) {

        this.documents.unshift(document);
        this.selectAndNotify(document);
    }


    public removeNewDocument() {

        this.documents = this.documents.filter(hasId);
    }


    public async setSelected(resourceId: string, adjustListIfNecessary: boolean = true): Promise<any> {

        this.documents = this.documents.filter(hasId);

        try {
            const documentToSelect: IdaiFieldDocument = await this.datastore.get(resourceId);
            this.newDocumentsFromRemote = subtract([documentToSelect.resource.id])(this.newDocumentsFromRemote);

            if (adjustListIfNecessary && !(await this.isDocumentInList(documentToSelect))) {
                await this.makeSureSelectedDocumentAppearsInList(documentToSelect);
                await this.populateDocumentList();
            }

            this.selectAndNotify(documentToSelect);

        } catch (e) {
            console.error('documentToSelect undefined in DocumentsManager.setSelected()');
        }
    }


    public async populateDocumentList(reset: boolean = true) {

        if (this.loading) this.loading.start();

        if (reset) {
            this.newDocumentsFromRemote = [];
            this.documents = [];
        }

        this.currentQueryId = new Date().toISOString();
        const result: IdaiFieldFindResult<IdaiFieldDocument> = await this.createUpdatedDocumentList(this.currentQueryId);

        await this.updateChildrenCountMap(result.documents);

        if (this.loading) this.loading.stop();
        if (result.queryId !== this.currentQueryId) return;

        this.documents = result.documents;
        this.totalDocumentCount = result.totalCount;

        ObserverUtil.notify(this.populateDocumentsObservers, this.documents);
    }


    public async createUpdatedDocumentList(queryId?: string): Promise<IdaiFieldFindResult<IdaiFieldDocument>> {

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
                    this.resourcesStateManager.getOverviewTypeNames(),
                    queryId
                )
            )
        );
    }


    private async updateChildrenCountMap(documents: Array<IdaiFieldDocument>) {

        for (let document of documents) {
           this.childrenCountMap[document.resource.id] = this.indexFacade.getCount(
               'liesWithin:contain', document.resource.id
           );
        }
    }


    private async isDocumentInList(document: IdaiFieldDocument): Promise<boolean> {

        return (await this.createUpdatedDocumentList()).documents.find(hasEqualId(document)) !== undefined;
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

        if (!this.documents.find(hasEqualId(ResourcesState.getSelectedDocument(this.resourcesStateManager.get())))) {
            this.deselect();
        }
    }


    private async handleRemoteChange(changedDocument: Document) {

        if (!this.documents) return;

        if (this.documents.find(hasEqualId(changedDocument))) {
            return ObserverUtil.notify(this.documentChangedFromRemoteObservers, undefined);
        }

        if (changedDocument.resource.type == this.resourcesStateManager.getViewType()) {
            return this.operationTypeDocumentsManager.populate();
        }

        this.newDocumentsFromRemote = unique(this.newDocumentsFromRemote.concat([changedDocument.resource.id]));
        await this.populateDocumentList(false);
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


    private async updatedDocumentListContainsSelectedDocument(documentToSelect: Document): Promise<boolean> {

        return (await this.createUpdatedDocumentList()).documents.find(hasEqualId(documentToSelect)) !== undefined;
    }


    private async fetchDocuments(query: Query): Promise<IdaiFieldFindResult<IdaiFieldDocument>> {

        try {
            return this.datastore.find(query);
        } catch (errWithParams) {
            DocumentsManager.handleFindErr(errWithParams, query);
            return { documents: [], totalCount: 0 };
        }
    }


    private static chooseIsRecordedInTargetIdOrIds(mainTypeDocumentResourceId: string|undefined,
                                                   operationTypeDocumentIds: () => string[],
                                                   bypassHierarchy: boolean,
                                                   selectAllOperationsOnBypassHierarchy: boolean): string|string[]|undefined {

        if (!mainTypeDocumentResourceId) return undefined;

        return bypassHierarchy && selectAllOperationsOnBypassHierarchy
            ? operationTypeDocumentIds()
            : mainTypeDocumentResourceId;
    }


    private static buildQuery(isRecordedInTargetIdOrIds: string|string[]|undefined, state: ResourcesState,
                              isInOverview: boolean, overviewTypeNames: string[], queryId?: string): Query {

        const bypassHierarchy = ResourcesState.getBypassHierarchy(state);
        const typeFilters = ResourcesState.getTypeFilters(state);
        const customConstraints = ResourcesState.getCustomConstraints(state);

        return {
            q: ResourcesState.getQueryString(state),
            constraints: DocumentsManager.buildConstraints(
                customConstraints,
                isRecordedInTargetIdOrIds,
                ResourcesState.getNavigationPath(state).selectedSegmentId,
                !bypassHierarchy
            ),
            types: (typeFilters.length > 0)
                ? typeFilters
                : !isRecordedInTargetIdOrIds && isInOverview && !bypassHierarchy
                    ? overviewTypeNames
                    : undefined,
            limit: bypassHierarchy ? DocumentsManager.documentLimit : undefined,
            id: queryId
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
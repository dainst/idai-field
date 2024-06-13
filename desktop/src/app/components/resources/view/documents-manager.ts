import { Observable, Observer } from 'rxjs';
import { clone, isString, set, subtract } from 'tsfun';
import { ChangesStream, Datastore, Document, FieldDocument, NewDocument, ObserverUtil, Query, Resource,
    CHILDOF_EXIST, Constraints, UNKNOWN, RemoteChangeInfo } from 'idai-field-core';
import { AngularUtility } from '../../../angular/angular-utility';
import { Loading } from '../../../components/widgets/loading';
import { ResourcesStateManager } from './resources-state-manager';
import { ResourcesState } from './state/resources-state';


const CHILDOF_CONTAIN = 'isChildOf:contain';


export const DEFAULT_DOCUMENTS_LIMIT: number = 20000;
export const GRID_LIST_DOCUMENTS_LIMIT: number = 5000;


/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DocumentsManager {

    private documents: Array<FieldDocument>;
    private newDocumentsFromRemote: Array<Resource.Id> = [];

    private totalDocumentCount: number;

    private deselectionObservers: Array<Observer<Document>> = [];
    private populateDocumentsObservers: Array<Observer<Array<Document>>> = [];
    private documentChangedFromRemoteObservers: Array<Observer<undefined>> = [];
    private selectViaResourceLinkObservers: Array<Observer<Document>> = [];
    private childrenCountMap: { [resourceId: string]: number } = {};

    private currentQueryId: string;
    private populateInProgress: boolean = false;


    constructor(private datastore: Datastore,
                changesStream: ChangesStream,
                private resourcesStateManager: ResourcesStateManager,
                private loading: Loading,
                private getIndexMatchTermCount: (indexName: string, matchTerm: string) => number) {
        
        changesStream.remoteChangesNotifications()
            .subscribe(remoteChangeInfo => this.handleRemoteChange(remoteChangeInfo));
    }


    public getDocuments = () => this.documents;

    public getTotalDocumentCount = () => this.totalDocumentCount;

    public getChildrenCount = (document: FieldDocument) => this.childrenCountMap[document.resource.id];

    public deselectionNotifications = (): Observable<Document> =>
        ObserverUtil.register(this.deselectionObservers);

    public populateDocumentsNotifactions = (): Observable<Array<Document>> =>
        ObserverUtil.register(this.populateDocumentsObservers);

    public documentChangedFromRemoteNotifications = (): Observable<undefined> =>
        ObserverUtil.register(this.documentChangedFromRemoteObservers);

    public selectViaResourceLinkNotifications = (): Observable<Document> =>
        ObserverUtil.register(this.selectViaResourceLinkObservers);

    public isPopulateInProgress = () => this.populateInProgress;


    public isNewDocumentFromRemote(document: Document): boolean {

        if (!document.resource.id) return false;
        return this.newDocumentsFromRemote.includes(document.resource.id);
    }


    public async setQueryString(q: string, populate: boolean = true) {

        this.resourcesStateManager.setQueryString(q);
        if (populate) await this.populateAndDeselectIfNecessary();
    }


    public async setCategoryFilters(categories: string[], populate: boolean = true) {

        this.resourcesStateManager.setCategoryFilters(categories);
        if (populate) await this.populateAndDeselectIfNecessary();
    }


    public async setCustomConstraints(constraints: { [name: string]: string}) {

        this.resourcesStateManager.setCustomConstraints(constraints);
        await this.populateAndDeselectIfNecessary();
    }


    public async setExtendedSearchMode(extendedSearchMode: boolean) {

        this.resourcesStateManager.setExtendedSearchMode(extendedSearchMode);
        await this.populateAndDeselectIfNecessary();
    }


    public async moveInto(document: FieldDocument|string|undefined, resetFiltersAndSelection: boolean = false,
                          rebuildNavigationPath: boolean = false) {

        try {
            if (isString(document)) {
                document = (await this.datastore.get(document)) as FieldDocument;
            } else if (document) {
                await this.datastore.get(document.resource.id);
            }
        } catch (errWithParams) {
            throw errWithParams; // Throw error if the resource has been deleted from remote
        }

        if (rebuildNavigationPath && document) {
            await this.resourcesStateManager.updateNavigationPathForDocument(document, true);
        }

        await this.resourcesStateManager.moveInto(document);

        if (resetFiltersAndSelection) {
            await this.setCategoryFilters([], false);
            await this.setQueryString('', false);
            await this.deselect();
            await this.populateDocumentList();
        } else {
            await this.populateAndDeselectIfNecessary();
        }
    }


    public deselect() {

        if (ResourcesState.getSelectedDocument(this.resourcesStateManager.get())) {
            this.selectAndNotify(undefined, false);
            this.removeNewDocument();
            this.resourcesStateManager.setActiveDocumentViewTab(undefined);
        }
    }


    public addNewDocument(document: FieldDocument) {

        this.documents = [document].concat(this.documents);
        this.selectAndNotify(document, false);
    }


    public removeNewDocument() {

        if (this.documents.find(document => !NewDocument.hasId(document))) {
            this.documents = this.documents.filter(NewDocument.hasId);
        }
    }


    public async setSelected(resourceId: string, adjustListIfNecessary: boolean = true,
                             viaResourceLink: boolean = false): Promise<any> {

        this.removeNewDocument();

        const documentToSelect = await this.datastore.get(resourceId) as FieldDocument;
        this.newDocumentsFromRemote
            = subtract([documentToSelect.resource.id])(this.newDocumentsFromRemote);

        if (adjustListIfNecessary && !(await this.isDocumentInList(documentToSelect))) {
            await this.makeSureSelectedDocumentAppearsInList(documentToSelect);
            await this.populateDocumentList();
        }

        this.selectAndNotify(documentToSelect, viaResourceLink);
    }


    public async navigateDocumentList(direction: 'previous'|'next'): Promise<any> {

        if (!this.documents || this.documents.length === 0) return;

        const selectedDocument: FieldDocument|undefined
            = ResourcesState.getSelectedDocument(this.resourcesStateManager.get());

        if (!selectedDocument) {
            await this.setSelected(this.documents[0].resource.id);
        } else {
            let index: number = this.documents.findIndex(document => {
                return document.resource.id === selectedDocument.resource.id;
            }) + (direction === 'next' ? 1 : -1);
            if (index < 0) index = this.documents.length - 1;
            if (index === this.documents.length) index = 0;
            await this.setSelected(this.documents[index].resource.id);
        }
    }


    public async populateDocumentList(reset: boolean = true) {

        this.populateInProgress = true;
        if (this.loading) this.loading.start();

        if (reset) {
            this.newDocumentsFromRemote = [];
            this.documents = [];
        }

        await AngularUtility.refresh();

        this.currentQueryId = new Date().toISOString();
        const queryId = this.currentQueryId;
        const result = await this.createUpdatedDocumentList();

        await this.updateChildrenCountMap(result.documents as Array<FieldDocument>);

        if (this.loading) this.loading.stop();
        if (queryId !== this.currentQueryId) {
            this.populateInProgress = false;
            return;
        }

        this.documents = result.documents as Array<FieldDocument>;
        this.totalDocumentCount = result.totalCount;

        this.populateInProgress = false;
        ObserverUtil.notify(this.populateDocumentsObservers, this.documents);
    }


    public async createUpdatedDocumentList(): Promise<Datastore.FindResult> {

        if (!this.resourcesStateManager.isInSpecialView() && !this.makeIsRecordedInTarget() ) {
            return { documents: [], ids: [], totalCount: 0 };
        }

        const operationId: string|undefined = this.resourcesStateManager.isInSpecialView()
            ? undefined
            : this.resourcesStateManager.get().view;

        const query = DocumentsManager.buildQuery(
            operationId,
            this.resourcesStateManager,
            this.getAllowedCategoryNames()
        );

        return (await this.fetchDocuments(query));
    }


    private getAllowedCategoryNames(): string[] {

        return this.resourcesStateManager.isInOverview()
                && !this.resourcesStateManager.isInExtendedSearchMode()
            ? this.resourcesStateManager.getOverviewCategoryNames()
            : this.resourcesStateManager.isInTypesManagement()
                ? this.resourcesStateManager.getTypeManagementCategoryNames()
                : this.resourcesStateManager.isInInventoryManagement()
                    ? this.resourcesStateManager.getInventoryCategoryNames()
                    : this.resourcesStateManager.getConcreteFieldCategoryNames();
    }


    private async updateChildrenCountMap(documents: Array<FieldDocument>) {

        for (let document of documents) {
           this.childrenCountMap[document.resource.id] = this.getIndexMatchTermCount(
               CHILDOF_CONTAIN, document.resource.id
           );
        }
    }


    private async isDocumentInList(document: FieldDocument): Promise<boolean> {

        return (await this.createUpdatedDocumentList()).documents.find(Document.hasEqualId(document)) !== undefined;
    }


    private selectAndNotify(document: FieldDocument|undefined, viaResourceLink: boolean) {

        if (ResourcesState.getSelectedDocument(this.resourcesStateManager.get())) {
            ObserverUtil.notify(
                this.deselectionObservers,
                ResourcesState.getSelectedDocument(this.resourcesStateManager.get())
            );
        }

        this.resourcesStateManager.setSelectedDocument(document);
        if (viaResourceLink) ObserverUtil.notify(this.selectViaResourceLinkObservers, document);
    }


    private async populateAndDeselectIfNecessary() {

        await this.populateDocumentList();

        if (!this.documents.find(Document.hasEqualId(ResourcesState.getSelectedDocument(this.resourcesStateManager.get())))) {
            this.deselect();
        }
    }


    private async handleRemoteChange(remoteChangeInfo: RemoteChangeInfo) {

        if (!this.documents) return;

        if (!remoteChangeInfo.new) {
            return ObserverUtil.notify(this.documentChangedFromRemoteObservers, undefined);
        }

        this.newDocumentsFromRemote = set(
            this.newDocumentsFromRemote.concat([remoteChangeInfo.document.resource.id])
        );
        await this.populateDocumentList(false);
    }


    private makeIsRecordedInTarget(): string|undefined {

        return this.resourcesStateManager.isInOverview()
            ? undefined
            : this.resourcesStateManager.get().view;
    }


    private async makeSureSelectedDocumentAppearsInList(documentToSelect: FieldDocument) {

        await this.resourcesStateManager.updateNavigationPathForDocument(documentToSelect);
        await this.adjustQuerySettingsIfNecessary(documentToSelect);
    }


    private async adjustQuerySettingsIfNecessary(documentToSelect: Document) {

        if (!(await this.updatedDocumentListContainsSelectedDocument(documentToSelect))) {
            this.resourcesStateManager.setQueryString('');
            this.resourcesStateManager.setCategoryFilters([]);
            this.resourcesStateManager.setCustomConstraints({});
        }
    }


    private async updatedDocumentListContainsSelectedDocument(documentToSelect: Document): Promise<boolean> {

        return (await this.createUpdatedDocumentList()).documents.find(Document.hasEqualId(documentToSelect)) !== undefined;
    }


    private async fetchDocuments(query: Query): Promise<Datastore.FindResult> {

        try {
            return await this.datastore.find(query);
        } catch (errWithParams) {
            DocumentsManager.handleFindErr(errWithParams, query);
            return { documents: [], ids: [], totalCount: 0 };
        }
    }


    private static buildQuery(operationId: string|undefined,
                              resourcesStateManager: ResourcesStateManager,
                              allowedCategoryNames: string[]): Query {

        const extendedSearchMode = resourcesStateManager.isInExtendedSearchMode();
        const state = resourcesStateManager.get();
        const categoryFilters = ResourcesState.getCategoryFilters(state);
        const customConstraints = ResourcesState.getCustomConstraints(state);

        return {
            q: ResourcesState.getQueryString(state),
            constraints: DocumentsManager.buildConstraints(
                customConstraints,
                operationId,
                ResourcesState.getNavigationPath(state).selectedSegmentId,
                extendedSearchMode
            ),
            categories: (categoryFilters.length > 0)
                ? categoryFilters
                : allowedCategoryNames,
            limit: extendedSearchMode && ResourcesState.isLimitSearchResults(state)
                ? this.getDocumentsLimit(resourcesStateManager)
                : undefined
        };
    }


    private static buildConstraints(customConstraints: Constraints,
                                    operationId: string|undefined,
                                    liesWithinId: string|undefined,
                                    isInExtendedSearchMode: boolean): Constraints {

        const constraints = clone(customConstraints);

        if (!isInExtendedSearchMode) {
            if (liesWithinId) {
                constraints[CHILDOF_CONTAIN] = liesWithinId;
            } else if (operationId) {
                constraints[CHILDOF_CONTAIN] = operationId;
            } else {
                constraints[CHILDOF_EXIST] = UNKNOWN;
            }
        } else {
            if (operationId) constraints[CHILDOF_CONTAIN] = { value: operationId, searchRecursively: true };
        }
        return constraints;
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length === 2) console.error('Error with find. Cause:', errWithParams[1]);
    }


    private static getDocumentsLimit(resourcesStateManager: ResourcesStateManager): number {

        return resourcesStateManager.isInGridListView()
            ? GRID_LIST_DOCUMENTS_LIMIT
            : DEFAULT_DOCUMENTS_LIMIT;
    }
}

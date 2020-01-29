import {Observer, Observable} from 'rxjs';
import {subtract, unique, jsonClone} from 'tsfun';
import {Document, Query, FieldDocument} from 'idai-components-2';
import {FieldReadDatastore} from '../../datastore/field/field-read-datastore';
import {ChangesStream} from '../../datastore/core/changes-stream';
import {ObserverUtil} from '../../util/observer-util';
import {Loading} from '../../../components/widgets/loading';
import {ResourcesStateManager} from './resources-state-manager';
import {IdaiFieldFindResult} from '../../datastore/core/cached-read-datastore';
import {ResourcesState} from './state/resources-state';
import {AngularUtility} from '../../../angular-utility';
import {ModelUtil} from '../../model/model-util';
import hasId = ModelUtil.hasId;
import hasEqualId = ModelUtil.hasEqualId;


const LIES_WITHIN_EXIST = 'liesWithin:exist';
const LIES_WITHIN_CONTAIN = 'liesWithin:contain';
const RECORDED_IN_CONTAIN = 'isRecordedIn:contain';
const UNKNOWN = 'UNKNOWN';


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
    private populateInProgress: boolean = false;

    private static documentLimit: number = 200;


    constructor(
        private datastore: FieldReadDatastore,
        private changesStream: ChangesStream,
        private resourcesStateManager: ResourcesStateManager,
        private loading: Loading,
        private getIndexMatchTermCount: (indexName: string, matchTerm: string) => number
    ) {
        changesStream.remoteChangesNotifications()
            .subscribe(document => this.handleRemoteChange(document));
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

    public isPopulateInProgress = () => this.populateInProgress;


    public isNewDocumentFromRemote(document: Document): boolean {

        if (!document.resource.id) return false;
        return this.newDocumentsFromRemote.includes(document.resource.id);
    }


    public async setQueryString(q: string, populate: boolean = true) {

        this.resourcesStateManager.setQueryString(q);
        if (populate) await this.populateAndDeselectIfNecessary();
    }


    public async setTypeFilters(types: string[], populate: boolean = true) {

        this.resourcesStateManager.setTypeFilters(types);
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


    public async moveInto(document: FieldDocument|undefined, resetFiltersAndSelection: boolean = false) {

        await this.resourcesStateManager.moveInto(document);

        if (resetFiltersAndSelection) {
            await this.setTypeFilters([], false);
            await this.setQueryString('', false);
            await this.deselect();
            await this.populateDocumentList();
        } else {
            await this.populateAndDeselectIfNecessary();
        }
    }


    public deselect() {

        if (ResourcesState.getSelectedDocument(this.resourcesStateManager.get())) {
            this.selectAndNotify(undefined);
            this.removeNewDocument();
            this.resourcesStateManager.setActiveDocumentViewTab(undefined);
        }
    }


    public addNewDocument(document: FieldDocument) {

        this.documents.unshift(document);
        this.selectAndNotify(document);
    }


    public removeNewDocument() {

        this.documents = this.documents.filter(hasId);
    }


    public async setSelected(resourceId: string, adjustListIfNecessary: boolean = true): Promise<any> {

        this.removeNewDocument();

        try {
            const documentToSelect: FieldDocument = await this.datastore.get(resourceId);
            this.newDocumentsFromRemote
                = subtract([documentToSelect.resource.id])(this.newDocumentsFromRemote);

            if (adjustListIfNecessary && !(await this.isDocumentInList(documentToSelect))) {
                await this.makeSureSelectedDocumentAppearsInList(documentToSelect);
                await this.populateDocumentList();
            }

            this.selectAndNotify(documentToSelect);
        } catch (e) {
            console.error('documentToSelect undefined in DocumentsManager.setSelected()');
        }
    }


    public async navigateDocumentList(direction: 'previous'|'next'): Promise<any> {

        if (!this.documents || this.documents.length === 0) return;

        const selectedDocument: FieldDocument|undefined
            = ResourcesState.getSelectedDocument(this.resourcesStateManager.get());

        if (!selectedDocument) {
            await this.setSelected(this.documents[0].resource.id);
        } else {
            let index: number = this.documents.indexOf(selectedDocument) + (direction === 'next' ? 1 : -1);
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
        const result: IdaiFieldFindResult<FieldDocument>
            = await this.createUpdatedDocumentList(this.currentQueryId);

        await this.updateChildrenCountMap(result.documents);

        if (this.loading) this.loading.stop();
        if (result.queryId !== this.currentQueryId) {
            this.populateInProgress = false;
            return;
        }

        this.documents = result.documents;
        this.totalDocumentCount = result.totalCount;

        this.populateInProgress = false;
        ObserverUtil.notify(this.populateDocumentsObservers, this.documents);
    }


    public async createUpdatedDocumentList(queryId?: string): Promise<IdaiFieldFindResult<FieldDocument>> {

        const isRecordedInTarget = this.makeIsRecordedInTarget();
        if (!isRecordedInTarget && !this.resourcesStateManager.isInSpecialView()) {
            return { documents: [], totalCount: 0 };
        }

        const operationId: string|undefined = this.resourcesStateManager.isInSpecialView()
            ? undefined
            : this.resourcesStateManager.get().view;

        const query = DocumentsManager.buildQuery(
            operationId,
            this.resourcesStateManager,
            this.getAllowedTypeNames(),
            queryId
        );

        return (await this.fetchDocuments(query));
    }


    private getAllowedTypeNames(): string[] {

        return this.resourcesStateManager.isInOverview()
                && !this.resourcesStateManager.isInExtendedSearchMode()
            ? this.resourcesStateManager.getOverviewTypeNames()
            : this.resourcesStateManager.isInTypesManagement()
                ? this.resourcesStateManager.getAbstractTypeNames()
                : this.resourcesStateManager.getConcreteTypeNames();
    }


    private async updateChildrenCountMap(documents: Array<FieldDocument>) {

        for (let document of documents) {
           this.childrenCountMap[document.resource.id] = this.getIndexMatchTermCount(
               LIES_WITHIN_CONTAIN, document.resource.id
           );
        }
    }


    private async isDocumentInList(document: FieldDocument): Promise<boolean> {

        return (await this.createUpdatedDocumentList()).documents.find(hasEqualId(document)) !== undefined;
    }


    private selectAndNotify(document: FieldDocument|undefined) {

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

        this.newDocumentsFromRemote = unique(this.newDocumentsFromRemote.concat([changedDocument.resource.id]));
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
            this.resourcesStateManager.setTypeFilters([]);
            this.resourcesStateManager.setCustomConstraints({});
        }
    }


    private async updatedDocumentListContainsSelectedDocument(documentToSelect: Document): Promise<boolean> {

        return (await this.createUpdatedDocumentList()).documents.find(hasEqualId(documentToSelect)) !== undefined;
    }


    private async fetchDocuments(query: Query): Promise<IdaiFieldFindResult<FieldDocument>> {

        try {
            const ignoreTypes = !query.types
                && !(this.resourcesStateManager.isInOverview() && ResourcesState.isInExtendedSearchMode(this.resourcesStateManager.get()));
            return await this.datastore.find(query, ignoreTypes);

        } catch (errWithParams) {
            DocumentsManager.handleFindErr(errWithParams, query);
            return { documents: [], totalCount: 0 };
        }
    }


    private static buildQuery(operationId: string|undefined, resourcesStateManager: ResourcesStateManager,
                              allowedTypeNames: string[], queryId?: string): Query {

        const extendedSearchMode: boolean = resourcesStateManager.isInExtendedSearchMode();
        const state: ResourcesState = resourcesStateManager.get();
        const typeFilters: string[] = ResourcesState.getTypeFilters(state);
        const customConstraints: { [name: string]: string } = ResourcesState.getCustomConstraints(state);

        return {
            q: ResourcesState.getQueryString(state),
            constraints: DocumentsManager.buildConstraints(
                customConstraints,
                operationId,
                ResourcesState.getNavigationPath(state).selectedSegmentId,
                !extendedSearchMode
            ),
            types: (typeFilters.length > 0)
                ? typeFilters
                : allowedTypeNames,
            limit: extendedSearchMode ? DocumentsManager.documentLimit : undefined,
            id: queryId
        };
    }


    private static buildConstraints(customConstraints: { [name: string]: string },
                                    operationId: string|undefined,
                                    liesWithinId: string|undefined,
                                    addLiesWithinConstraints: boolean): { [name: string]: string|string[]} {

        const constraints: { [name: string]: string|string[] } = jsonClone(customConstraints) as any;

        if (addLiesWithinConstraints) {
            if (liesWithinId) {
                constraints[LIES_WITHIN_CONTAIN] = liesWithinId;
            } else {
                constraints[LIES_WITHIN_EXIST] = UNKNOWN;
            }
        }

        if (operationId) constraints[RECORDED_IN_CONTAIN] = operationId;

        return constraints;
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length === 2) console.error('Error with find. Cause:', errWithParams[1]);
    }
}
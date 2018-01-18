import {Observable} from 'rxjs/Observable';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {MainTypeDocumentsManager} from './main-type-documents-manager';
import {NavigationPathManager} from './navigation-path-manager';
import {DocumentsManager} from './documents-manager';
import {ResourcesState} from './resources-state';
import {OperationViews} from './operation-views';
import {SettingsService} from '../../../core/settings/settings-service';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/idai-field-document-read-datastore';
import {ChangesStream} from '../../../core/datastore/core/changes-stream';
import {NavigationPath} from '../navigation-path';

/**
 * Manages an overview of operation type resources
 * and different views for each operation type.
 *
 * In the overview the document list contains the operation type resources.
 * In the operation type views the list contains resources recorded in
 * one selected operation type resource.
 *
 * Apart from that, each view behaves the same in that the document list
 * can get filteres etc.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class StateFacade {

    private viewManager: NavigationPathManager;
    private mainTypeDocumentsManager: MainTypeDocumentsManager;
    private documentsManager: DocumentsManager;


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private changesStream: ChangesStream,
        private settingsService: SettingsService,
        private resourcesState: ResourcesState
    ) {
        this.viewManager = new NavigationPathManager(
            resourcesState,
            datastore
        );
        this.mainTypeDocumentsManager = new MainTypeDocumentsManager(
            datastore,
            this.viewManager,
            resourcesState
        );
        this.documentsManager = new DocumentsManager(
            datastore,
            changesStream,
            settingsService,
            this.viewManager,
            this.mainTypeDocumentsManager,
            resourcesState
        );
    }


    public isInOverview() {

        return this.resourcesState.isInOverview();
    }

    
    public getCurrentViewName() {

        if (!this.resourcesState.getView()) return;
        return this.resourcesState.getView();
    }


    public getOperationSubtypeViews() {

        return this.resourcesState.getViews();
    }


    /**
     * @returns the main type of the currently selected view.
     * This is either 'Project' or one of the operation types names.
     */
    public getCurrentViewMainType(): string|undefined {

        if (this.resourcesState.isInOverview()) return 'Project';
        if (!this.resourcesState.getView()) return undefined;
        return this.resourcesState.getViewType();
    }


    public getMainTypeHomeViewName(mainTypeName: string): string|undefined {

        if (!mainTypeName) return undefined;
        if (mainTypeName == 'Project') return 'project';

        return this.resourcesState.getViewNameForOperationSubtype(mainTypeName);
    }


    public getMainTypeLabel(): string {

        if (this.isInOverview()) throw StateFacade.err('getMainTypeLabel');

        return (this.resourcesState.getView() == 'project')
            ? 'Projekt' : this.resourcesState.getLabelForName(this.resourcesState.getView());
    }


    public getActiveDocumentViewTab(): string|undefined {

        return this.resourcesState.getActiveDocumentViewTab();
    }


    public setActiveDocumentViewTab(activeDocumentViewTab: string|undefined) {

        this.resourcesState.setActiveDocumentViewTab(activeDocumentViewTab);
    }


    public deselect() {

        return this.documentsManager.deselect();
    }


    public getMode() {

        return this.resourcesState.getMode();
    }


    // TODO remove
    public getQuery() {

        return {
            q: this.resourcesState.getQueryString(),
            types: this.resourcesState.getTypeFilters()
        }
    }


    public getProjectDocument() {

        return this.documentsManager.projectDocument;
    }


    public async handleMainTypeDocumentOnDeleted() {

        const selectedDocument = this.resourcesState.getSelectedOperationTypeDocument();
        if (!selectedDocument) return;
        if (!selectedDocument.resource.id) return;

        this.resourcesState.removeActiveLayersIds();
        this.viewManager.setLastSelectedOperationTypeDocumentId(undefined);
        await this.populateMainTypeDocuments();
    }


    // TODO it should not be necessary to specify mainTypeDocumentResourceId, it simply should be the currently selected mainTypeDocument
    public setActiveLayersIds(mainTypeDocumentResourceId: string, activeLayersIds: string[]) {

        return this.resourcesState.setActiveLayersIds(activeLayersIds);
    }


    // TODO it should not be necessary to specify mainTypeDocumentResourceId, it simply should be the currently selected mainTypeDocument
    public getActiveLayersIds(mainTypeDocumentResourceId: string): string[] {

        const ids: string[] = this.resourcesState.getActiveLayersIds();

        return ids ? ids : [];
    }


    public getSelectedMainTypeDocument(): IdaiFieldDocument|undefined {

        if (this.isInOverview()) throw StateFacade.err('getSelectedMainTypeDocument');
        return this.resourcesState.getSelectedOperationTypeDocument();
    }


    public getMainTypeDocuments() {

        if (this.isInOverview()) throw StateFacade.err('getMainTypeDocuments');
        return this.mainTypeDocumentsManager.getDocuments();
    }


    public async getAllOperationSubtypeWithViewDocuments() {

        const viewMainTypes = this.resourcesState.getViews()
            .map((view: any) => {return view.operationSubtype});

        let mainTypeDocuments: Array<Document> = [];

        for (let viewMainType of viewMainTypes) {
            if (viewMainType == 'Project') continue;

            mainTypeDocuments = mainTypeDocuments.concat(
                (await this.datastore.find({ q: '', types: [viewMainType] })).documents);
        }

        return mainTypeDocuments;
    }


    public getFilterTypes() {

        return this.resourcesState.getTypeFilters();
    }


    public getQueryString() {

        return this.resourcesState.getQueryString();
    }


    public setMode(mode: string) {

        this.resourcesState.setMode(mode);
    }


    public setSelectedDocumentById(id: string) {

        return this.documentsManager.setSelectedById(id);
    }


    public isNewDocumentFromRemote(document: Document) {

        return this.documentsManager.isNewDocumentFromRemote(document);
    }


    public remove(document: Document) {

        return this.documentsManager.remove(document);
    }


    public getSelectedDocument() {

        return this.documentsManager.getSelectedDocument();
    }


    /**
     * Sets the this.documentsManager.selectedDocument
     * and if necessary, also
     * a) selects the operation type document,
     * this.documntsManager.selectedDocument is recorded in, accordingly and
     * b) invalidates query settings in order to make sure
     * this.documentsManager.selectedDocument is part of the search hits of the document list.
     *
     * @param document exits immediately if this is
     *   a) the same as this.documentsManager.selectedDocument or
     *   b) the same as this.mainTypeManager.selectedMainTypeDocument or
     *   c) undefined
     * @returns {Document}
     */
    public setSelectedDocument(document: Document) {

        return this.documentsManager.setSelected(document);
    }


    public getDocuments() {

        return this.documentsManager.getDocuments();
    }


    public async setSearchString(q: string) {

        await this.documentsManager.setQueryString(q);
    }


    public async setTypesToFilterBy(types: string[]) {

        await this.documentsManager.setQueryTypes(types);
    }


    public async setNavigationPath(navigationPath: NavigationPath) {

        await this.documentsManager.setNavigationPath(navigationPath);
    }


    public navigationPathNotifications(): Observable<NavigationPath> {

        return this.viewManager.navigationPathNotifications();
    }


    public deselectionNotifications(): Observable<Document> {

        return this.documentsManager.deselectionNotifications();
    }


    public getNavigationPath(): NavigationPath {

        if (this.isInOverview()) return { elements: [] };

        const selectedMainTypeDocument = this.getSelectedMainTypeDocument();
        if (!selectedMainTypeDocument) return { elements: [] };

        return this.viewManager.getNavigationPath(selectedMainTypeDocument.resource.id as string);
    }


    public getCurrentFilterType() {

        return this.resourcesState.getCurrentFilterType();
    }


    /**
     * @returns true if isSelectedDocumentRecordedInSelectedMainTypeDocument
     */
    public async selectMainTypeDocument(mainTypeDocument: Document): Promise<boolean> {

        if (this.isInOverview()) throw StateFacade.err('selectMainTypeDocument');
        this.mainTypeDocumentsManager.select(mainTypeDocument as IdaiFieldDocument);

        await this.populateDocumentList();

        if (!this.isSelectedDocumentRecordedInSelectedMainTypeDocument()) {
            this.documentsManager.deselect();
            return false;
        } else {
            return true;
        }
    }


    public populateDocumentList() {

        return this.documentsManager.populateDocumentList();
    }


    /**
     * Based on the current view, populates the operation type documents and also
     * sets the selectedMainTypeDocument to either
     *   a) the last selected one for that view if any or
     *   b) the first element of the operation type documents it is not set
     *      and operation type documents length > 1
     *
     * @returns {Promise<any>}
     */
    public async populateMainTypeDocuments() {

        if (this.isInOverview()) throw StateFacade.err('populateMainTypeDocuments');
        await this.mainTypeDocumentsManager.populate();
    }


    public async setupView(viewName: string, defaultMode: string) {

        await this._setupView(viewName, defaultMode);
        await this.documentsManager.populateProjectDocument();

        let mainTypeResource: IdaiFieldDocument|undefined;

        if (!this.isInOverview()) {
            await this.populateMainTypeDocuments();
            const selectedMainTypeDocument: IdaiFieldDocument|undefined = this.getSelectedMainTypeDocument();
            if (selectedMainTypeDocument) mainTypeResource = selectedMainTypeDocument;
        } else {
            // TODO Check if there is another way to notify resources component about navigation path change when entering overview
            mainTypeResource = this.getProjectDocument() as any;
        }

        if (mainTypeResource) {
            this.viewManager.setLastSelectedOperationTypeDocumentId(mainTypeResource);
            this.viewManager.notifyNavigationPathObservers(mainTypeResource.resource.id as string);
        }

        await this.populateDocumentList();
    }


    private _setupView(viewName: string, defaultMode: string): Promise<any> {

        return ((!this.resourcesState.getView() || viewName != this.resourcesState.getView())
            ? this.resourcesState.setView(viewName)

            // TODO simplify this branch
            : Promise.resolve()).then(() => {
            return this.resourcesState.initialize(defaultMode ? 'map' : undefined);
        });
    }


    private isSelectedDocumentRecordedInSelectedMainTypeDocument(): boolean {

        if (!this.documentsManager.getSelectedDocument()) return false;

        return this.mainTypeDocumentsManager.isRecordedInSelectedOperationTypeDocument(
            this.documentsManager.getSelectedDocument()
        );
    }


    private static err(fnName: string, notAllowedWhenIsInOverview = true) {
        
        const notMarker = notAllowedWhenIsInOverview ? '' : '! ';
        return 'Calling ' + fnName + ' is forbidden when ' + notMarker + 'isInOverview';
    }
}
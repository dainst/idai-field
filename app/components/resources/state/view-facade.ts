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
import {NavigationPath} from './navigation-path';

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
export class ViewFacade {

    private navigationPathManager: NavigationPathManager;
    private mainTypeDocumentsManager: MainTypeDocumentsManager;
    private documentsManager: DocumentsManager;


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private changesStream: ChangesStream,
        private settingsService: SettingsService,
        private resourcesState: ResourcesState
    ) {
        this.navigationPathManager = new NavigationPathManager(
            resourcesState,
            datastore
        );
        this.mainTypeDocumentsManager = new MainTypeDocumentsManager(
            datastore,
            this.navigationPathManager,
            resourcesState
        );
        this.documentsManager = new DocumentsManager(
            datastore,
            changesStream,
            settingsService,
            this.navigationPathManager,
            this.mainTypeDocumentsManager,
            resourcesState
        );
    }


    public getCurrentViewName = () => this.resourcesState.getView();

    public isInOverview = () => this.resourcesState.isInOverview();

    public getOperationSubtypeViews = () => this.resourcesState.getViews();

    public getMode = () => this.resourcesState.getMode();

    public getProjectDocument = () => this.documentsManager.projectDocument;

    public getFilterTypes = () => this.resourcesState.getTypeFilters();

    public getSelectedDocument = () => this.documentsManager.getSelectedDocument();

    public getDocuments = () => this.documentsManager.getDocuments();

    public getActiveDocumentViewTab = () => this.resourcesState.getActiveDocumentViewTab();

    public getActiveLayersIds = () => this.resourcesState.getActiveLayersIds();

    public deselect = () => this.documentsManager.deselect();

    public setActiveLayersIds = (activeLayersIds: string[]) => this.resourcesState.setActiveLayersIds(activeLayersIds);

    public setMode = (mode: string) => this.resourcesState.setMode(mode);

    public setSelectedDocumentById = (id: string) => this.documentsManager.setSelectedById(id);

    public isNewDocumentFromRemote = (document: Document) => this.documentsManager.isNewDocumentFromRemote(document);

    public remove = (document: Document) => this.documentsManager.remove(document);

    public getQueryString = () => this.resourcesState.getQueryString();

    public setSearchString = (q: string) => this.documentsManager.setQueryString(q);

    public setTypeFilters = (types: string[]) => this.documentsManager.setTypeFilters(types);

    public moveInto = (document: IdaiFieldDocument) => this.documentsManager.moveInto(document);

    public navigationPathNotifications = () => this.navigationPathManager.navigationPathNotifications();

    public deselectionNotifications = () => this.documentsManager.deselectionNotifications();

    public getNavigationPath = () => this.resourcesState.getNavigationPath();

    public populateDocumentList = () => this.documentsManager.populateDocumentList();


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

        if (this.isInOverview()) throw ViewFacade.err('getMainTypeLabel');

        return (this.resourcesState.getView() == 'project')
            ? 'Projekt' : this.resourcesState.getLabelForName(this.resourcesState.getView());
    }


    public async handleMainTypeDocumentOnDeleted() {

        const selectedDocument = this.resourcesState.getMainTypeDocument();
        if (!selectedDocument) return;
        if (!selectedDocument.resource.id) return;

        this.resourcesState.removeActiveLayersIds();
        this.navigationPathManager.setMainTypeDocument(undefined);
        await this.populateMainTypeDocuments();
    }


    public getSelectedMainTypeDocument(): IdaiFieldDocument|undefined {

        if (this.isInOverview()) throw ViewFacade.err('getSelectedMainTypeDocument');
        return this.resourcesState.getMainTypeDocument();
    }


    public getMainTypeDocuments() {

        if (this.isInOverview()) throw ViewFacade.err('getMainTypeDocuments');
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


    public setActiveDocumentViewTab(activeDocumentViewTab: string|undefined) {

        this.resourcesState.setActiveDocumentViewTab(activeDocumentViewTab);
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


    public getCurrentFilterType()  {

        const filterTypes = this.resourcesState.getTypeFilters();
        if (!filterTypes) return undefined;

        return (filterTypes.length > 0 ?
            filterTypes[0] : undefined);
    }


    /**
     * @returns true if isSelectedDocumentRecordedInSelectedMainTypeDocument
     */
    public async selectMainTypeDocument(mainTypeDocument: Document): Promise<boolean> {

        if (this.isInOverview()) throw ViewFacade.err('selectMainTypeDocument');
        this.mainTypeDocumentsManager.select(mainTypeDocument as IdaiFieldDocument);

        await this.populateDocumentList();

        if (!this.isSelectedDocumentRecordedInSelectedMainTypeDocument()) {
            this.documentsManager.deselect();
            return false;
        } else {
            return true;
        }
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

        if (this.isInOverview()) throw ViewFacade.err('populateMainTypeDocuments');
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

        if (mainTypeResource) this.navigationPathManager.setMainTypeDocument(mainTypeResource);
        this.navigationPathManager.notifyNavigationPathObservers();

        await this.populateDocumentList();
    }


    public _setupView(viewName: string, defaultMode: string): Promise<any> {

        return ((!this.resourcesState.getView() || viewName != this.resourcesState.getView())
            ? this.resourcesState.setView(viewName)

            // TODO simplify
            : Promise.resolve()).then(() => this.resourcesState.initialize(defaultMode));
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
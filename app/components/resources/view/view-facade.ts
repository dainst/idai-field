import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {OperationTypeDocumentsManager} from './operation-type-documents-manager';
import {DocumentsManager} from './documents-manager';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {RemoteChangesStream} from '../../../core/datastore/core/remote-changes-stream';
import {Loading} from '../../../widgets/loading';
import {ResourcesStateManager} from './resources-state-manager';
import {NavigationPath} from './state/navigation-path';
import {ResourcesState} from './state/resources-state';

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

    private operationTypeDocumentsManager: OperationTypeDocumentsManager;
    private documentsManager: DocumentsManager;


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private remoteChangesStream: RemoteChangesStream,
        private resourcesStateManager: ResourcesStateManager,
        private loading: Loading
    ) {
        this.operationTypeDocumentsManager = new OperationTypeDocumentsManager(
            datastore,
            resourcesStateManager
        );
        this.documentsManager = new DocumentsManager(
            datastore,
            remoteChangesStream,
            this.operationTypeDocumentsManager,
            resourcesStateManager,
            loading
        );
    }


    public addNewDocument = (document: IdaiFieldDocument) => this.documentsManager.addNewDocument(document);

    public getCurrentViewName = () => this.resourcesStateManager.get().view;

    public isInOverview = () => this.resourcesStateManager.isInOverview();

    public getOperationSubtypeViews = () => this.resourcesStateManager.getViews();

    public getMode = () => this.resourcesStateManager.get().mode;

    public getFilterTypes = () => ResourcesState.getTypeFilters(this.resourcesStateManager.get());

    public getDocuments = () => this.documentsManager.getDocuments();

    public getSelectedDocument = () => ResourcesState.getSelectedDocument(this.resourcesStateManager.get());

    public getTotalDocumentCount = () => this.documentsManager.getTotalDocumentCount();

    public getActiveDocumentViewTab = () => this.resourcesStateManager.get().activeDocumentViewTab;

    public setSelectedDocument = (resourceId: string) => this.documentsManager.setSelected(resourceId);

    public getActiveLayersIds = () => ResourcesState.getActiveLayersIds(this.resourcesStateManager.get());

    public deselect = () => this.documentsManager.deselect();

    public setActiveLayersIds = (activeLayersIds: string[]) => this.resourcesStateManager.setActiveLayersIds(activeLayersIds);

    public setMode = (mode: 'map' | 'list') => this.resourcesStateManager.setMode(mode);

    public isNewDocumentFromRemote = (document: Document) => this.documentsManager.isNewDocumentFromRemote(document);

    public getSearchString = () => ResourcesState.getQueryString(this.resourcesStateManager.get());

    public setSearchString = (q: string, populate?: boolean) => this.documentsManager.setQueryString(q, populate);

    public setFilterTypes = (types: string[]) => this.documentsManager.setTypeFilters(types);

    public moveInto = (document: IdaiFieldDocument|undefined) => this.documentsManager.moveInto(document);

    public rebuildNavigationPath = () => this.resourcesStateManager.rebuildNavigationPath();

    public populateDocumentList = () => this.documentsManager.populateDocumentList();

    public getCurrentViewMainType = () => this.resourcesStateManager.getViewType();

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this.resourcesStateManager.setActiveDocumentViewTab(activeDocumentViewTab);

    public getBypassHierarchy = () => ResourcesState.getBypassHierarchy(this.resourcesStateManager.get());

    public setBypassHierarchy = (bypassHierarchy: boolean) => this.documentsManager.setBypassHierarchy(bypassHierarchy);

    public getSelectAllOperationsOnBypassHierarchy = () => ResourcesState.getSelectAllOperationsOnBypassHierarchy(this.resourcesStateManager.get());

    public navigationPathNotifications = () => this.resourcesStateManager.navigationPathNotifications();

    public deselectionNotifications = () => this.documentsManager.deselectionNotifications();

    public populateDocumentNotifications = () => this.documentsManager.populateDocumentsNotifactions();


    public getNavigationPath() {

        return this.isInOverview()
            ? NavigationPath.empty()
            : ResourcesState.getNavigationPath(this.resourcesStateManager.get());
    }


    public getMainTypeHomeViewName(mainTypeName: string): string|undefined {

        return (mainTypeName === 'Project')
            ? 'project'
            : this.resourcesStateManager.getViewNameForOperationSubtype(mainTypeName);
    }


    public getOperationLabel(): string {

        if (this.isInOverview()) throw ViewFacade.err('getOperationLabel');
        return this.resourcesStateManager.getLabelForName(this.resourcesStateManager.get().view) as string; // cast ok, we are not in overview
    }


    public getSelectedOperations(): Array<IdaiFieldDocument> {

        if (this.isInOverview()) return [];
        if (!this.operationTypeDocumentsManager.getDocuments()) return [];
        if (this.getBypassHierarchy() && this.getSelectAllOperationsOnBypassHierarchy()) {
            return this.operationTypeDocumentsManager.getDocuments();
        }
        const selectedOperationTypeDocument = this.operationTypeDocumentsManager.getDocuments()
            .find(_ => _.resource.id === ResourcesState.getMainTypeDocumentResourceId(this.resourcesStateManager.get()));
        return selectedOperationTypeDocument ? [selectedOperationTypeDocument] : [];
    }


    public getOperations(): Array<IdaiFieldDocument> {

        if (this.isInOverview()) throw ViewFacade.err('getOperations');
        return this.operationTypeDocumentsManager.getDocuments();
    }


    public async getAllOperations(): Promise<Array<Document>> {

        const viewMainTypes = this.resourcesStateManager.getViews()
            .map((view: any) => {return view.operationSubtype});

        let mainTypeDocuments: Array<Document> = [];

        for (let viewMainType of viewMainTypes) {
            if (viewMainType === 'Project') continue;

            mainTypeDocuments = mainTypeDocuments.concat(
                (await this.datastore.find({ q: '', types: [viewMainType] })).documents);
        }

        return mainTypeDocuments;
    }


    public getCurrentFilterType()  {

        const filterTypes = ResourcesState.getTypeFilters(this.resourcesStateManager.get());
        return filterTypes && filterTypes.length > 0 ? filterTypes[0] : undefined;
    }


    public async setSelectAllOperationsOnBypassHierarchy(selectAllOperationsOnBypassHierarchy: boolean) {

        if (this.isInOverview()) throw ViewFacade.err('setSelectAllOperationsOnBypassHierarchy');
        await this.documentsManager.setSelectAllOperationsOnBypassHierarchy(selectAllOperationsOnBypassHierarchy);
    }


    public async selectOperation(resourceId: string): Promise<void> {

        if (this.isInOverview()) throw ViewFacade.err('selectOperation');
        if (this.getBypassHierarchy()) await this.setSelectAllOperationsOnBypassHierarchy(false);
        this.resourcesStateManager.setMainTypeDocument(resourceId);
        await this.populateDocumentList();
    }


    /**
     * Based on the current view, populates the operation type documents and also
     * sets the selectedMainTypeDocument to either
     *   a) the last selected one for that view if any or
     *   b) the first element of the operation type documents it is not set
     *      and operation type documents length > 1
     */
    public async populateOperations(): Promise<void> {

        if (this.isInOverview()) throw ViewFacade.err('populateOperations');
        await this.operationTypeDocumentsManager.populate();
    }


    public async selectView(viewName: string): Promise<void> {

        await this.resourcesStateManager.initialize(viewName);
        await this.setupMainTypeDocument();
        await this.populateDocumentList();
    }


    private async setupMainTypeDocument(): Promise<void> {

        let mainTypeResourceid: string|undefined;

        if (!this.isInOverview()) {
            await this.populateOperations();
            mainTypeResourceid = ResourcesState.getMainTypeDocumentResourceId(this.resourcesStateManager.get());
        } else {
            mainTypeResourceid = 'project';
        }

        this.resourcesStateManager.setMainTypeDocument(mainTypeResourceid);
    }


    private static err(fnName: string, notAllowedWhenIsInOverview = true) {
        
        const notMarker = notAllowedWhenIsInOverview ? '' : '! ';
        return 'Calling ' + fnName + ' is forbidden when ' + notMarker + 'isInOverview';
    }
}
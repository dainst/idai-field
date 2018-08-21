import {Document, ProjectConfiguration} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {OperationsManager} from './operations-manager';
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

    private operationsManager: OperationsManager;
    private documentsManager: DocumentsManager;
    private ready: boolean;


    constructor(
        private projectConfiguration: ProjectConfiguration,
        private datastore: IdaiFieldDocumentReadDatastore,
        private remoteChangesStream: RemoteChangesStream,
        private resourcesStateManager: ResourcesStateManager,
        private loading: Loading
    ) {
        this.operationsManager = new OperationsManager(
            datastore,
            resourcesStateManager
        );
        this.documentsManager = new DocumentsManager(
            datastore,
            remoteChangesStream,
            this.operationsManager,
            resourcesStateManager,
            loading
        );
    }


    public addNewDocument = (document: IdaiFieldDocument) => this.documentsManager.addNewDocument(document);

    public getView = (): string => this.resourcesStateManager.get().view;

    public getViewType = () => this.resourcesStateManager.getViewType(); // main type of the current view

    public isInOverview = () => this.resourcesStateManager.isInOverview();

    public getOperationSubtypeViews = () => this.resourcesStateManager.getViews();

    public getMode = () => this.resourcesStateManager.get().mode;

    public getFilterTypes = () => ResourcesState.getTypeFilters(this.resourcesStateManager.get());

    public getCustomConstraints = () => ResourcesState.getCustomConstraints(this.resourcesStateManager.get());

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

    public setCustomConstraints = (constraints: { [name: string]: string}) => this.documentsManager.setCustomConstraints(constraints);

    public moveInto = (document: IdaiFieldDocument|undefined) => this.documentsManager.moveInto(document);

    public rebuildNavigationPath = () => this.resourcesStateManager.rebuildNavigationPath();

    public populateDocumentList = () => this.documentsManager.populateDocumentList();

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this.resourcesStateManager.setActiveDocumentViewTab(activeDocumentViewTab);

    public getBypassHierarchy = () => ResourcesState.getBypassHierarchy(this.resourcesStateManager.get());

    public setBypassHierarchy = (bypassHierarchy: boolean) => this.documentsManager.setBypassHierarchy(bypassHierarchy);

    public getMainTypeHomeViewName = (mainTypeName: string) => this.resourcesStateManager.getViewNameForMainType(mainTypeName);

    public getAllOperations = () => this.operationsManager.getAllOperations();

    public getSelectAllOperationsOnBypassHierarchy = () => ResourcesState.getSelectAllOperationsOnBypassHierarchy(this.resourcesStateManager.get());

    public navigationPathNotifications = () => this.resourcesStateManager.navigationPathNotifications();

    public deselectionNotifications = () => this.documentsManager.deselectionNotifications();

    public populateDocumentNotifications = () => this.documentsManager.populateDocumentsNotifactions();

    public isReady = () => this.ready;


    public getNavigationPath() {

        return this.isInOverview()
            ? NavigationPath.empty()
            : ResourcesState.getNavigationPath(this.resourcesStateManager.get());
    }


    public getOperationLabel(): string {

        if (this.isInOverview()) throw ViewFacade.err('getOperationLabel');
        const typeName: string = this.resourcesStateManager
            .getOperationSubtypeForViewName(this.resourcesStateManager.get().view) as string;

        return this.projectConfiguration.getTypesMap()[typeName].label;
    }


    public getSelectedOperations(): Array<IdaiFieldDocument> {

        if (this.isInOverview()) return [];
        if (!this.operationsManager.getDocuments()) return [];
        if (this.getBypassHierarchy() && this.getSelectAllOperationsOnBypassHierarchy()) {
            return this.operationsManager.getDocuments();
        }
        const selectedOperationTypeDocument = this.operationsManager.getDocuments()
            .find(_ => _.resource.id === ResourcesState.getMainTypeDocumentResourceId(this.resourcesStateManager.get()));
        return selectedOperationTypeDocument ? [selectedOperationTypeDocument] : [];
    }


    public getOperations(): Array<IdaiFieldDocument> {

        if (this.isInOverview()) throw ViewFacade.err('getOperations');
        return this.operationsManager.getDocuments();
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
        await this.operationsManager.populate();
    }


    public async selectView(viewName: string): Promise<void> {

        this.ready = false;

        await this.resourcesStateManager.initialize(viewName);
        await this.operationsManager.populate();
        await this.populateDocumentList();

        this.ready = true;
    }


    private static err(fnName: string) {
        
        return 'Calling ' + fnName + ' is forbidden when isInOverview';
    }
}
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {OperationTypeDocumentsManager} from './operation-type-documents-manager';
import {NavigationPathManager} from './navigation-path-manager';
import {DocumentsManager} from './documents-manager';
import {ResourcesState} from './resources-state';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {RemoteChangesStream} from '../../../core/datastore/core/remote-changes-stream';
import {Loading} from '../../../widgets/loading';

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
    private operationTypeDocumentsManager: OperationTypeDocumentsManager;
    private documentsManager: DocumentsManager;


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private remoteChangesStream: RemoteChangesStream,
        private resourcesState: ResourcesState,
        private loading: Loading
    ) {
        this.navigationPathManager = new NavigationPathManager(
            resourcesState,
            datastore
        );
        this.operationTypeDocumentsManager = new OperationTypeDocumentsManager(
            datastore,
            this.navigationPathManager,
            resourcesState
        );
        this.documentsManager = new DocumentsManager(
            datastore,
            remoteChangesStream,
            this.navigationPathManager,
            this.operationTypeDocumentsManager,
            resourcesState,
            loading
        );
    }


    public setSelectedDocument = (document: Document) => this.documentsManager.setSelected(document as IdaiFieldDocument);

    public addNewDocument = (document: IdaiFieldDocument) => this.documentsManager.addNewDocument(document);

    public getCurrentViewName = () => this.resourcesState.getView();

    public isInOverview = () => this.resourcesState.isInOverview();

    public getOperationSubtypeViews = () => this.resourcesState.getViews();

    public getMode = () => this.resourcesState.getMode();

    public getFilterTypes = () => this.resourcesState.getTypeFilters();

    public getSelectedDocument = () => this.documentsManager.getSelectedDocument();

    public getDocuments = () => this.documentsManager.getDocuments();

    public getActiveDocumentViewTab = () => this.resourcesState.getActiveDocumentViewTab();

    public getActiveLayersIds = () => this.resourcesState.getActiveLayersIds();

    public deselect = () => this.documentsManager.deselect();

    public setActiveLayersIds = (activeLayersIds: string[]) => this.resourcesState.setActiveLayersIds(activeLayersIds);

    public setMode = (mode: 'map' | 'list') => this.resourcesState.setMode(mode);

    public isNewDocumentFromRemote = (document: Document) => this.documentsManager.isNewDocumentFromRemote(document);

    public remove = (document: Document) => this.documentsManager.removeFromDocuments(document);

    public getQueryString = () => this.resourcesState.getQueryString();

    public setSearchString = (q: string) => this.documentsManager.setQueryString(q);

    public setTypeFilters = (types: string[]) => this.documentsManager.setTypeFilters(types);

    public moveInto = (document: IdaiFieldDocument|undefined) => this.documentsManager.moveInto(document);

    public navigationPathNotifications = () => this.navigationPathManager.navigationPathNotifications();

    public deselectionNotifications = () => this.documentsManager.deselectionNotifications();

    public populateDocumentNotifications = () => this.documentsManager.populateDocumentsNotifactions();

    public getNavigationPath = () => this.navigationPathManager.getNavigationPath();

    public rebuildNavigationPath = () => this.navigationPathManager.rebuildNavigationPath();

    public populateDocumentList = () => this.documentsManager.populateDocumentList();

    public getCurrentViewMainType = () => this.resourcesState.getViewType();

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this.resourcesState.setActiveDocumentViewTab(activeDocumentViewTab);

    public getIgnoreHierarchy = () => this.documentsManager.getIgnoreHierarchy();

    public setIgnoreHierarchy = (ignoreHierarchy: boolean) => this.documentsManager.setIgnoreHierarchy(ignoreHierarchy);


    public getMainTypeHomeViewName(mainTypeName: string): string|undefined {

        return (mainTypeName === 'Project')
            ? 'project'
            : this.resourcesState.getViewNameForOperationSubtype(mainTypeName);
    }


    public getOperationTypeLabel(): string {

        if (this.isInOverview()) throw ViewFacade.err('getOperationTypeLabel');
        return this.resourcesState.getLabelForName(this.resourcesState.getView()) as string; // cast ok, we are not in overview
    }


    public getSelectedOperationTypeDocument(): IdaiFieldDocument|undefined {

        if (this.isInOverview()) throw ViewFacade.err('getSelectedOperationTypeDocument');
        if (!this.operationTypeDocumentsManager.getDocuments()) return undefined;

        const selectedOperationTypeDocument = this.operationTypeDocumentsManager.getDocuments()
            .filter(_ => _.resource.id === this.resourcesState.getMainTypeDocumentResourceId());
        return selectedOperationTypeDocument.length > 0
            ? selectedOperationTypeDocument[0]
            : undefined;
    }


    public getOperationTypeDocuments(): Array<IdaiFieldDocument> {

        if (this.isInOverview()) throw ViewFacade.err('getOperationTypeDocuments');
        return this.operationTypeDocumentsManager.getDocuments();
    }


    public async getAllOperationSubtypeWithViewDocuments(): Promise<Array<Document>> {

        const viewMainTypes = this.resourcesState.getViews()
            .map((view: any) => {return view.operationSubtype});

        let mainTypeDocuments: Array<Document> = [];

        for (let viewMainType of viewMainTypes) {
            if (viewMainType === 'Project') continue;

            mainTypeDocuments = mainTypeDocuments.concat(
                (await this.datastore.find({ q: '', types: [viewMainType] })).documents);
        }

        return mainTypeDocuments;
    }


    public async setSelectedDocumentById(resourceId: string) {

        await this.documentsManager.setSelected(await this.datastore.get(resourceId));
    }


    public getCurrentFilterType()  {

        const filterTypes = this.resourcesState.getTypeFilters();
        return filterTypes && filterTypes.length > 0 ? filterTypes[0] : undefined;
    }


    public async selectOperationTypeDocument(operationTypeDocument: Document): Promise<void> {

        if (this.isInOverview()) throw ViewFacade.err('selectMainTypeDocument');
        this.navigationPathManager.setMainTypeDocument(operationTypeDocument.resource.id);
        this.setIgnoreHierarchy(false);
        await this.populateDocumentList();
    }


    /**
     * Based on the current view, populates the operation type documents and also
     * sets the selectedMainTypeDocument to either
     *   a) the last selected one for that view if any or
     *   b) the first element of the operation type documents it is not set
     *      and operation type documents length > 1
     */
    public async populateOperationTypeDocuments(): Promise<void> {

        if (this.isInOverview()) throw ViewFacade.err('populateOperationTypeDocuments');
        await this.operationTypeDocumentsManager.populate();
    }


    public async selectView(viewName: string): Promise<void> {

        await this.resourcesState.initialize(viewName);
        await this.setupMainTypeDocument();
        this.setIgnoreHierarchy(false);
        await this.populateDocumentList();
    }


    private async setupMainTypeDocument(): Promise<void> {

        let mainTypeResourceid: string|undefined;

        if (!this.isInOverview()) {
            await this.populateOperationTypeDocuments();
            mainTypeResourceid = this.resourcesState.getMainTypeDocumentResourceId();
        } else {
            mainTypeResourceid = 'project';
        }

        this.navigationPathManager.setMainTypeDocument(mainTypeResourceid);
    }


    private static err(fnName: string, notAllowedWhenIsInOverview = true) {
        
        const notMarker = notAllowedWhenIsInOverview ? '' : '! ';
        return 'Calling ' + fnName + ' is forbidden when ' + notMarker + 'isInOverview';
    }
}
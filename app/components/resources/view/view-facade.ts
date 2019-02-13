import {Document, ProjectConfiguration, FieldDocument} from 'idai-components-2';
import {DocumentsManager} from './documents-manager';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {RemoteChangesStream} from '../../../core/datastore/core/remote-changes-stream';
import {Loading} from '../../../widgets/loading';
import {ResourcesStateManager} from './resources-state-manager';
import {NavigationPath} from './state/navigation-path';
import {ResourcesState} from './state/resources-state';
import {IndexFacade} from '../../../core/datastore/index/index-facade';

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

    private documentsManager: DocumentsManager;
    private ready: boolean;


    constructor(
        private projectConfiguration: ProjectConfiguration,
        private datastore: FieldReadDatastore,
        private remoteChangesStream: RemoteChangesStream,
        private resourcesStateManager: ResourcesStateManager,
        private loading: Loading,
        private indexFacade: IndexFacade
    ) {
        this.documentsManager = new DocumentsManager(
            datastore,
            remoteChangesStream,
            resourcesStateManager,
            loading,
            (indexName: string, matchTerm: string) =>
                indexFacade.getCount(indexName, matchTerm)
        );
    }


    public addNewDocument = (document: FieldDocument) => this.documentsManager.addNewDocument(document);

    public removeNewDocument = () => this.documentsManager.removeNewDocument();

    public getView = (): string => this.resourcesStateManager.get().view;

    public getCurrentOperation = (): FieldDocument|undefined =>
        this.resourcesStateManager.getCurrentOperation();

    public isInOverview = () => this.resourcesStateManager.isInOverview();

    public getActiveOperationViews = () => this.resourcesStateManager.getActiveOperationViews();

    public getMode = () => this.resourcesStateManager.getMode();

    public getFilterTypes = () => ResourcesState.getTypeFilters(this.resourcesStateManager.get());

    public getCustomConstraints = () => ResourcesState.getCustomConstraints(this.resourcesStateManager.get());

    public getDocuments = () => this.documentsManager.getDocuments();

    public getSelectedDocument = () => ResourcesState.getSelectedDocument(this.resourcesStateManager.get());

    public getTotalDocumentCount = () => this.documentsManager.getTotalDocumentCount();

    public getChildrenCount = (document: FieldDocument) => this.documentsManager.getChildrenCount(document);

    public getActiveDocumentViewTab = () => this.resourcesStateManager.get().activeDocumentViewTab;

    public setSelectedDocument = (resourceId: string, adjustListIfNecessary?: boolean) => this.documentsManager.setSelected(resourceId, adjustListIfNecessary);

    public getActiveLayersIds = () => ResourcesState.getActiveLayersIds(this.resourcesStateManager.get());

    public deselect = () => this.documentsManager.deselect();

    public setActiveLayersIds = (activeLayersIds: string[]) => this.resourcesStateManager.setActiveLayersIds(activeLayersIds);

    public setMode = (mode: 'map' | 'list') => this.resourcesStateManager.setMode(mode);

    public isNewDocumentFromRemote = (document: Document) => this.documentsManager.isNewDocumentFromRemote(document);

    public getSearchString = () => ResourcesState.getQueryString(this.resourcesStateManager.get());

    public setSearchString = (q: string, populate?: boolean) => this.documentsManager.setQueryString(q, populate);

    public setFilterTypes = (types: string[]) => this.documentsManager.setTypeFilters(types);

    public setCustomConstraints = (constraints: { [name: string]: string}) => this.documentsManager.setCustomConstraints(constraints);

    public moveInto = (document: FieldDocument|undefined) => this.documentsManager.moveInto(document);

    public rebuildNavigationPath = () => this.resourcesStateManager.rebuildNavigationPath();

    public populateDocumentList = () => this.documentsManager.populateDocumentList();

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this.resourcesStateManager.setActiveDocumentViewTab(activeDocumentViewTab);

    public getBypassHierarchy = () => ResourcesState.getBypassHierarchy(this.resourcesStateManager.get());

    public setBypassHierarchy = (bypassHierarchy: boolean) => this.documentsManager.setBypassHierarchy(bypassHierarchy);

    public navigationPathNotifications = () => this.resourcesStateManager.navigationPathNotifications();

    public deselectionNotifications = () => this.documentsManager.deselectionNotifications();

    public populateDocumentNotifications = () => this.documentsManager.populateDocumentsNotifactions();

    public documentChangedFromRemoteNotifications = () => this.documentsManager.documentChangedFromRemoteNotifications();

    public deactivate = (viewName: string) => this.resourcesStateManager.deactivate(viewName);

    public isReady = () => this.ready && !this.documentsManager.isPopulateInProgress();


    public getNavigationPath() {

        return this.isInOverview()
            ? NavigationPath.empty()
            : ResourcesState.getNavigationPath(this.resourcesStateManager.get());
    }


    public async selectView(viewName: 'project'|string): Promise<void> {

        this.ready = false;
        await this.resourcesStateManager.initialize(viewName);
        await this.populateDocumentList();
        this.ready = true;
    }
}
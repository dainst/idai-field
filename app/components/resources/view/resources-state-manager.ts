import {Observer, Observable} from 'rxjs';
import {FieldDocument} from 'idai-components-2';
import {ResourcesState} from './state/resources-state';
import {StateSerializer} from '../../../common/state-serializer';
import {ViewState} from './state/view-state';
import {NavigationPath} from './state/navigation-path';
import {ObserverUtil} from '../../../core/util/observer-util';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {clone} from '../../../core/util/object-util';
import {IndexFacade} from '../../../core/datastore/index/index-facade';
import {TypeUtility} from '../../../core/model/type-utility';


/**
 * Holds the reference to the current ResourcesState and replaces it by a modified
 * version on write access. Serializes parts of it on certain events.
 *
 * Holds a reference to the OperationViews
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesStateManager {

    public loaded: boolean = false;

    public navigationPathNotifications = (): Observable<NavigationPath> =>
        ObserverUtil.register(this.navigationPathObservers);

    private resourcesState = ResourcesState.makeDefaults();
    private navigationPathObservers: Array<Observer<NavigationPath>> = [];

    /**
     * Clients can obtain the latest ResourcesState with this method.
     * Its fields are readonly and the ResourcesState's companion module's
     * setter methods return always copies. So the only way to modify
     * the resources state is via the setters of ResourcesStateManager,
     * which replace the whole ResourcesState in a proper transformation
     * on every change.
     */
    public get = (): ResourcesState => this.resourcesState;


    constructor(
        private datastore: FieldReadDatastore,
        private indexFacade: IndexFacade,
        private serializer: StateSerializer,
        private typeUtility: TypeUtility,
        private project: string,
        private suppressLoadMapInTestProject: boolean = false,
    ) {}


    public resetForE2E = () => this.resourcesState = ResourcesState.makeDefaults();

    public isInOverview = () => this.resourcesState.view === 'project';

    public getCurrentOperation = (): FieldDocument|undefined =>
        ResourcesState.getCurrentOperation(this.resourcesState);

    public getOverviewTypeNames = (): string[] => this.typeUtility.getOverviewTypeNames();


    public async initialize(viewName: 'project' | string) {

        if (!this.loaded) {
            this.resourcesState = await this.load();
            this.loaded = true;
        }

        const currentMode: 'map'|'list' = this.getMode();

        this.resourcesState.view = viewName;

        if (viewName !== 'project') {
            if (!this.resourcesState.operationViewStates[viewName]) {
                this.resourcesState.operationViewStates[viewName] = ViewState.default();
                this.resourcesState.operationViewStates[viewName].mode = currentMode;
            }
            if (!this.resourcesState.operationViewStates[viewName].operation) {
                this.resourcesState.operationViewStates[viewName].operation =
                    await this.datastore.get(viewName);
            }
            this.resourcesState.operationViewStates[viewName].active = true;
            this.serialize();
        }

        this.setActiveDocumentViewTab(undefined);
        this.notifyNavigationPathObservers();
    }


    public deactivate(viewName: string) {

        ResourcesState.deactivate(this.resourcesState, viewName);
        this.notifyNavigationPathObservers();
    }


    public getActiveOperationViews(): {[id: string]: string} {

        return Object.keys(this.resourcesState.operationViewStates)
            .filter(viewName => this.resourcesState.operationViewStates[viewName].active)
            .reduce((acc, viewName) => {
                const operation: FieldDocument|undefined
                    = this.resourcesState.operationViewStates[viewName].operation;

                if (!operation) console.warn('Missing operation document for view: ' + viewName);

                acc[viewName] = !operation
                    ?'MISSING'
                    :operation.resource.identifier;

                return acc;

            }, {} as {[id: string]: string});
    }


    public getMode(): 'map'|'list' {

        return ResourcesState.getMode(this.resourcesState);
    }


    public setActiveDocumentViewTab(activeDocumentViewTab: string|undefined) {

        ResourcesState.setActiveDocumentViewTab(this.resourcesState, activeDocumentViewTab);
    }


    public setSelectedDocument(document: FieldDocument|undefined) {

        ResourcesState.setSelectedDocument(this.resourcesState, document);
    }


    public setQueryString(q: string) {

        ResourcesState.setQueryString(this.resourcesState, q);
    }


    public setTypeFilters(types: string[]) {

        ResourcesState.setTypeFilters(this.resourcesState, types);
    }


    public setCustomConstraints(constraints: { [name: string]: string}) {

        ResourcesState.setCustomConstraints(this.resourcesState, constraints);
    }


    public setMode(mode: 'map' | 'list') {

        ResourcesState.setMode(this.resourcesState, mode);
        this.serialize();
    }


    public setBypassHierarchy(bypassHierarchy: boolean) {

        ResourcesState.setBypassHierarchy(this.resourcesState, bypassHierarchy);
        this.notifyNavigationPathObservers();
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        ResourcesState.setActiveLayerIds(this.resourcesState, activeLayersIds);
        this.serialize();
    }


    public async moveInto(document: FieldDocument|undefined) {

        const invalidSegment = await NavigationPath.findInvalidSegment(
            this.resourcesState.view,
            ResourcesState.getNavigationPath(this.resourcesState),
            (resourceId: string) => {
                return this.indexFacade.getCount('id:match', resourceId) > 0;
            });

        const validatedNavigationPath = invalidSegment
            ? NavigationPath.shorten(ResourcesState.getNavigationPath(this.resourcesState), invalidSegment)
            : ResourcesState.getNavigationPath(this.resourcesState);

        const updatedNavigationPath = NavigationPath.setNewSelectedSegmentDoc(validatedNavigationPath, document);

        ResourcesState.updateNavigationPath(
            this.resourcesState,
            await this.updateSelectedDocument(updatedNavigationPath)
        );

        this.notifyNavigationPathObservers();
    }


    public async rebuildNavigationPath() {

        const segment = NavigationPath.getSelectedSegment(ResourcesState.getNavigationPath(this.resourcesState));
        await this.moveInto(segment ? segment.document : undefined);
    }


    public async updateNavigationPathForDocument(document: FieldDocument) {

        this.setBypassHierarchy(false);

        if (!NavigationPath.isPartOfNavigationPath(document, ResourcesState.getNavigationPath(this.resourcesState),
                this.resourcesState.view)) {
            await this.createNavigationPathForDocument(document);
        }
    }


    private notifyNavigationPathObservers() {

        ObserverUtil.notify(this.navigationPathObservers, clone(ResourcesState.getNavigationPath(this.resourcesState)));
    }


    private async createNavigationPathForDocument(document: FieldDocument) {

        const segments = await NavigationPath.makeSegments(document, resourceId => this.datastore.get(resourceId));
        if (segments.length === 0) return await this.moveInto(undefined);

        const navPath = NavigationPath.replaceSegmentsIfNecessary(
            ResourcesState.getNavigationPath(this.resourcesState), segments, segments[segments.length - 1].document.resource.id);

        ResourcesState.updateNavigationPath(this.resourcesState, navPath);
        this.notifyNavigationPathObservers();
    }


    private serialize() {

        this.serializer.store(ResourcesStateManager.createObjectToSerialize(this.resourcesState),
            'resources-state');
    }


    private async load(): Promise<ResourcesState> {

        let resourcesState = ResourcesState.makeDefaults();

        if (this.project === 'test' || this.project === 'synctest') {
            if (!this.suppressLoadMapInTestProject) resourcesState = ResourcesState.makeSampleDefaults();
        } else {
            const loadedState = await this.serializer.load('resources-state');
            if (loadedState.overviewState) resourcesState.overviewState = loadedState.overviewState;
            if (loadedState.operationViewStates) {
                resourcesState.operationViewStates = loadedState.operationViewStates;
            }

            resourcesState = ResourcesState.complete(resourcesState);
        }

        await this.addOperations(resourcesState);

        return resourcesState;
    }


    private async addOperations(resourcesState: ResourcesState) {

        for (let id of Object.keys(resourcesState.operationViewStates)) {
            try {
                resourcesState.operationViewStates[id].operation = await this.datastore.get(id);
            } catch (err) {
                console.warn('Failed to load operation document for view: ' + id);
                delete resourcesState.operationViewStates[id];
            }
        }
    }


    private async updateSelectedDocument(navigationPath: NavigationPath): Promise<NavigationPath> {

        const selectedDocument: FieldDocument|undefined
            = NavigationPath.getSelectedDocument(navigationPath);

        if (!selectedDocument) return navigationPath;

        NavigationPath.setSelectedDocument(
            navigationPath,
            await this.datastore.get(selectedDocument.resource.id)
        );
        return navigationPath;
    }


    private static createObjectToSerialize(state: ResourcesState): any {

        const objectToSerialize: { overviewState: any, operationViewStates: any } = {
            overviewState: this.createObjectToSerializeForViewState(state.overviewState),
            operationViewStates: {}
        };

        for (let viewName of Object.keys(state.operationViewStates)) {
            objectToSerialize.operationViewStates[viewName]
                = this.createObjectToSerializeForViewState(state.operationViewStates[viewName]);
        }

        return objectToSerialize;
    }


    private static createObjectToSerializeForViewState(viewState: ViewState): any {

        const objectToSerialize: any = {
            active: viewState.active,
            mode: viewState.mode
        };

        if (viewState.layerIds) objectToSerialize.layerIds = viewState.layerIds;

        return objectToSerialize;
    }
}
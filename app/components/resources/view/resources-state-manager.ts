import {Injectable} from '@angular/core';
import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable'
import {IdaiFieldDocument} from 'idai-components-2';
import {ResourcesState} from './state/resources-state';
import {StateSerializer} from '../../../common/state-serializer';
import {OperationViews} from './state/operation-views';
import {ViewState} from './state/view-state';
import {NavigationPath} from './state/navigation-path';
import {ObserverUtil} from '../../../util/observer-util';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {clone} from '../../../util/object-util';


@Injectable()
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
        private datastore: IdaiFieldDocumentReadDatastore,
        private serializer: StateSerializer,
        private views: OperationViews,
        private additionalOverviewTypeNames: string[],
        private project: string,
        private suppressLoadMapInTestProject: boolean = false,
    ) {}


    public resetForE2E = () => this.resourcesState = ResourcesState.makeDefaults();

    public getViewType = () => this.isInOverview() ? 'Project' : this.getOperationSubtypeForViewName(this.resourcesState.view);

    public isInOverview = () => this.resourcesState.view === 'project';

    public getViews = () => this.views.get();

    public getLabelForName = (name: string) => this.views.getLabelForName(name);

    public getOperationSubtypeForViewName = (name: string) => this.views.getOperationSubtypeForViewName(name);


    public getViewNameForMainType(name: string) {

        return (name === 'Project')
            ? 'project'
            : this.views.getViewNameForOperationSubtype(name);
    }


    public async initialize(viewName: string): Promise<any> {

        if (!this.loaded) {
            this.resourcesState = await this.load();
            this.loaded = true;
        }

        this.resourcesState = ResourcesState.setView(this.resourcesState, viewName);

        if (!this.resourcesState.viewStates[this.resourcesState.view]) {
            this.resourcesState.viewStates[this.resourcesState.view] = ViewState.default();
        }

        this.setActiveDocumentViewTab(undefined);
    }


    public getOverviewTypeNames() {
        return this.views.get()
            .map(_ => _.operationSubtype)
            .concat(this.additionalOverviewTypeNames);
    }


    public setActiveDocumentViewTab(activeDocumentViewTab: string|undefined) {

        this.resourcesState = ResourcesState.setActiveDocumentViewTab(this.resourcesState, activeDocumentViewTab);
    }


    public setSelectedDocument(document: IdaiFieldDocument|undefined) {

        this.resourcesState = ResourcesState.setSelectedDocument(this.resourcesState, document);
    }


    public setQueryString(q: string) {

        this.resourcesState = ResourcesState.setQueryString(this.resourcesState, q);
    }


    public setTypeFilters(types: string[]) {

        this.resourcesState = ResourcesState.setTypeFilters(this.resourcesState, types);
    }


    public setCustomConstraints(constraints: { [name: string]: string}) {

        this.resourcesState = ResourcesState.setCustomConstraints(this.resourcesState, constraints);
    }


    public setMode(mode: 'map' | 'list') {

        this.resourcesState = ResourcesState.setMode(this.resourcesState, mode);
    }

    public setBypassHierarchy(bypassHierarchy: boolean) {

        this.resourcesState = ResourcesState.setBypassHierarchy(this.resourcesState, bypassHierarchy);
        this.notifyNavigationPathObservers();
    }


    public setSelectAllOperationsOnBypassHierarchy(selectAllOperationsOnBypassHierarchy: boolean) {

        this.resourcesState = ResourcesState.setSelectAllOperationsOnBypassHierarchy(this.resourcesState,
            selectAllOperationsOnBypassHierarchy);
        this.notifyNavigationPathObservers();
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        this.resourcesState = ResourcesState.setActiveLayerIds(this.resourcesState, activeLayersIds);
        this.serialize();
    }


    public removeActiveLayersIds() {

        this.resourcesState = ResourcesState.removeActiveLayersIds(this.resourcesState);
        this.serialize();
    }


    public async moveInto(document: IdaiFieldDocument|undefined) {

        const invalidSegment = await NavigationPath.findInvalidSegment(
            ResourcesState.getMainTypeDocumentResourceId(this.resourcesState),
            ResourcesState.getNavigationPath(this.resourcesState),
            async (resourceId: string) => (await this.datastore.find({ q: '',
                constraints: { 'id:match': resourceId }})).totalCount !== 0);

        const validatedNavigationPath = invalidSegment
            ? NavigationPath.shorten(ResourcesState.getNavigationPath(this.resourcesState), invalidSegment)
            : ResourcesState.getNavigationPath(this.resourcesState);

        const updatedNavigationPath = NavigationPath.setNewSelectedSegmentDoc(validatedNavigationPath, document);
        this.resourcesState = ResourcesState.updateNavigationPath(this.resourcesState, updatedNavigationPath);
        this.notifyNavigationPathObservers();
    }


    public async rebuildNavigationPath() {

        const segment = NavigationPath.getSelectedSegment(ResourcesState.getNavigationPath(this.resourcesState));
        await this.moveInto(segment ? segment.document : undefined);
    }


    public setMainTypeDocument(resourceId: string|undefined) {

        this.resourcesState = ResourcesState.setMainTypeDocumentResourceId(this.resourcesState, resourceId);

        if (resourceId && !this.resourcesState.viewStates[this.resourcesState.view].navigationPaths[resourceId]) {
            this.resourcesState.viewStates[this.resourcesState.view].navigationPaths[resourceId]
                = NavigationPath.empty();
        }

        this.notifyNavigationPathObservers();
    }


    public async updateNavigationPathForDocument(document: IdaiFieldDocument) {

        this.setBypassHierarchy(false);

        if (!NavigationPath.isPartOfNavigationPath(document, ResourcesState.getNavigationPath(this.resourcesState),
                ResourcesState.getMainTypeDocumentResourceId(this.resourcesState))) {
            await this.createNavigationPathForDocument(document);
        }
    }


    private notifyNavigationPathObservers() {

        ObserverUtil.notify(this.navigationPathObservers, clone(ResourcesState.getNavigationPath(this.resourcesState)));
    }


    private async createNavigationPathForDocument(document: IdaiFieldDocument) {

        const segments = await NavigationPath.makeSegments(document, resourceId => this.datastore.get(resourceId));
        if (segments.length == 0) return await this.moveInto(undefined);

        const navPath = NavigationPath.replaceSegmentsIfNecessary(
            ResourcesState.getNavigationPath(this.resourcesState), segments, segments[segments.length - 1].document.resource.id);

        this.resourcesState = ResourcesState.updateNavigationPath(this.resourcesState, navPath);
        this.notifyNavigationPathObservers();
    }


    private serialize() {

        this.serializer.store(ResourcesStateManager.createObjectToSerialize(this.resourcesState),
            'resources-state');
    }


    private async load(): Promise<ResourcesState> {

        let resourcesState = ResourcesState.makeDefaults();

        if (this.project === 'test' ) {
            if (!this.suppressLoadMapInTestProject) resourcesState = ResourcesState.makeSampleDefaults()
        } else {
            (resourcesState as any).viewStates = await this.serializer.load('resources-state');
            resourcesState = ResourcesState.complete(resourcesState);
        }

        return resourcesState;
    }


    private static createObjectToSerialize(state: ResourcesState) : { [viewName: string]: ViewState } {

        const objectToSerialize: { [viewName: string]: ViewState } = {};

        for (let viewName of Object.keys(state.viewStates)) {
            objectToSerialize[viewName] = {} as any;
            if (ResourcesState.getLayerIds(state)) {
                (objectToSerialize[viewName] as any).layerIds = ResourcesState.getLayerIds(state);
            }
        }

        return objectToSerialize;
    }
}
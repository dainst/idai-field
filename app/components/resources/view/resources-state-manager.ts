import {Injectable} from '@angular/core';
import {ResourcesState} from './state/resources-state';
import {StateSerializer} from '../../../common/state-serializer';
import {OperationViews} from './state/operation-views';
import {ViewState} from './state/view-state';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {NavigationPath} from './state/navigation-path';
import {ObserverUtil} from '../../../util/observer-util';
import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable'
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {ObjectUtil} from '../../../util/object-util';


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

    private navigationPathObservers: Array<Observer<NavigationPath>> = [];

    private resourcesState: ResourcesState = ResourcesState.makeDefaults();

    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private serializer: StateSerializer,
        private views: OperationViews,
        private additionalOverviewTypeNames: string[],
        private project: string,
        private suppressLoadMapInTestProject: boolean = false,
    ) {}


    public get = () => this.resourcesState; // TODO return copy

    public resetForE2E = () => this.resourcesState = ResourcesState.makeDefaults();

    public getActiveDocumentViewTab = () => this.resourcesState.activeDocumentViewTab;

    public getViewType = () => this.isInOverview() ? 'Project' : this.getOperationSubtypeForViewName(this.resourcesState.view);

    public isInOverview = () => this.resourcesState.view === 'project';

    public getViews = () => this.views.get();

    public getViewNameForOperationSubtype = (name: string) => this.views.getViewNameForOperationSubtype(name);

    public getLabelForName = (name: string) => this.views.getLabelForName(name);

    public getOperationSubtypeForViewName = (name: string) => this.views.getOperationSubtypeForViewName(name);

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this.resourcesState.activeDocumentViewTab = activeDocumentViewTab;

    public setMode = (mode: 'map' | 'list') => this.resourcesState.mode = mode; // TODO make proper transition for whole state object

    public setSelectedDocument = (document: IdaiFieldDocument|undefined) => this.resourcesState = ResourcesState.setSelectedDocument(this.resourcesState, document);

    public setQueryString = (q: string) => this.resourcesState = ResourcesState.setQueryString(this.resourcesState, q);

    public setTypeFilters = (types: string[]) => this.resourcesState = ResourcesState.setTypeFilters(this.resourcesState, types);

    public navigationPathNotifications = (): Observable<NavigationPath> =>
        ObserverUtil.register(this.navigationPathObservers);

    public getOverviewTypeNames = () => this.views.get()
        .map(_ => _.operationSubtype)
        .concat(this.additionalOverviewTypeNames);


    public async initialize(viewName: string): Promise<any> {

        if (!this.loaded) {
            this.resourcesState = await this.load();
            this.loaded = true;
        }

        this.resourcesState.view = viewName;

        if (!this.resourcesState.viewStates[this.resourcesState.view]) this.resourcesState.viewStates[this.resourcesState.view] = ViewState.default();
        this.setActiveDocumentViewTab(undefined);
    }


    public setDisplayHierarchy(displayHierarchy: boolean) {

        this.resourcesState = ResourcesState.setDisplayHierarchy(this.resourcesState, displayHierarchy);
        this.notifyNavigationPathObservers();
    }


    public setBypassOperationTypeSelection(bypassOperationTypeSelection: boolean) {

        this.resourcesState = ResourcesState.setBypassOperationTypeSelection(this.resourcesState,
            bypassOperationTypeSelection);
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

        if (!resourceId) return;

        if (!this.resourcesState.viewStates[this.resourcesState.view].navigationPaths[resourceId]) {
            this.resourcesState.viewStates[this.resourcesState.view].navigationPaths[resourceId] = NavigationPath.empty();
            this.notifyNavigationPathObservers();
        }
        this.resourcesState.viewStates[this.resourcesState.view].mainTypeDocumentResourceId = resourceId;
    }


    public async updateNavigationPathForDocument(document: IdaiFieldDocument) {

        this.setDisplayHierarchy(true);

        if (!NavigationPath.isPartOfNavigationPath(document, ResourcesState.getNavigationPath(this.resourcesState),
                ResourcesState.getMainTypeDocumentResourceId(this.resourcesState))) {
            await this.createNavigationPathForDocument(document);
        }
    }


    private notifyNavigationPathObservers() {

        ObserverUtil.notify(this.navigationPathObservers, ObjectUtil.cloneObject(ResourcesState.getNavigationPath(this.resourcesState)));
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

        this.serializer.store(ResourcesStateManager.createObjectToSerialize(this.resourcesState));
    }


    private async load(): Promise<ResourcesState> {

        let resourcesState = ResourcesState.makeDefaults();

        if (this.project === 'test' ) {
            if (!this.suppressLoadMapInTestProject) resourcesState = ResourcesState.makeSampleDefaults()
        } else {
            resourcesState.viewStates = await this.serializer.load();
            resourcesState = ResourcesState.complete(resourcesState);
        }

        return resourcesState;
    }


    private static createObjectToSerialize(state: ResourcesState) : { [viewName: string]: ViewState } {

        const objectToSerialize: { [viewName: string]: ViewState } = {};

        for (let viewName of Object.keys(state.viewStates)) {
            objectToSerialize[viewName] = {} as any;
            if (ResourcesState.getLayerIds(state)) {
                objectToSerialize[viewName].layerIds = ResourcesState.getLayerIds(state);
            }
        }

        return objectToSerialize;
    }
}
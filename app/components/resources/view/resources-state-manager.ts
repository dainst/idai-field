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

    private _: ResourcesState = ResourcesState.makeDefaults();

    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private serializer: StateSerializer,
        private views: OperationViews,
        private additionalOverviewTypeNames: string[],
        private project: string,
        private suppressLoadMapInTestProject: boolean = false,
    ) {}


    public async initialize(viewName: string): Promise<any> {

        if (!this.loaded) {
            this._ = await this.load();
            this.loaded = true;
        }

        this._.view = viewName;

        if (!this.getViewState()) this._.viewStates[this._.view] = ViewState.default();
        this.setActiveDocumentViewTab(undefined);
    }


    public getOverviewTypeNames = () => this.views.get()
        .map(_ => _.operationSubtype)
        .concat(this.additionalOverviewTypeNames);


    public get = () => this._;

    public resetForE2E = () => this._ = ResourcesState.makeDefaults();

    public getActiveDocumentViewTab = () => this._.activeDocumentViewTab;

    public getViewType = () => this.isInOverview() ? 'Project' : this.getOperationSubtypeForViewName(this._.view);

    public isInOverview = () => this._.view === 'project';

    public getViews = () => this.views.get();

    public getViewNameForOperationSubtype = (name: string) => this.views.getViewNameForOperationSubtype(name);

    public getLabelForName = (name: string) => this.views.getLabelForName(name);

    public getOperationSubtypeForViewName = (name: string) => this.views.getOperationSubtypeForViewName(name);

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this._.activeDocumentViewTab = activeDocumentViewTab;

    public setMode = (mode: 'map' | 'list') => this._.mode = mode;

    public setSelectedDocument = (document: IdaiFieldDocument|undefined) => this._ = ResourcesState.setSelectedDocument(this._, document);

    public setQueryString = (q: string) => this._ = ResourcesState.setQueryString(this._, q);

    public setTypeFilters = (types: string[]) => this._ = ResourcesState.setTypeFilters(this._, types);


    public navigationPathNotifications = (): Observable<NavigationPath> =>
        ObserverUtil.register(this.navigationPathObservers);


    public setDisplayHierarchy(displayHierarchy: boolean) {

        this._ = ResourcesState.setDisplayHierarchy(this._, displayHierarchy);
        this.notifyNavigationPathObservers();
    }


    public setBypassOperationTypeSelection(bypassOperationTypeSelection: boolean) {

        this._ = ResourcesState.setBypassOperationTypeSelection(this._, bypassOperationTypeSelection);
        this.notifyNavigationPathObservers();
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        this._ = ResourcesState.setActiveLayerIds(this._, activeLayersIds);
        this.serialize();
    }


    public removeActiveLayersIds() {

        this._ = ResourcesState.removeActiveLayersIds(this._);
        this.serialize();
    }


    public async moveInto(document: IdaiFieldDocument|undefined) {

        const invalidSegment = await NavigationPath.findInvalidSegment(
            ResourcesState.getMainTypeDocumentResourceId(this._),
            ResourcesState.getNavPath(this._),
            async (resourceId: string) => (await this.datastore.find({ q: '',
                constraints: { 'id:match': resourceId }})).totalCount !== 0);

        const validatedNavigationPath = invalidSegment
            ? NavigationPath.shorten(ResourcesState.getNavPath(this._), invalidSegment)
            : ResourcesState.getNavPath(this._);

        const updatedNavigationPath = NavigationPath.setNewSelectedSegmentDoc(validatedNavigationPath, document);
        this._ = ResourcesState.updateNavigationPath(this._, updatedNavigationPath);
        this.notifyNavigationPathObservers();
    }


    public async rebuildNavigationPath() {

        const segment = NavigationPath.getSelectedSegment(ResourcesState.getNavPath(this._));
        await this.moveInto(segment ? segment.document : undefined);
    }


    public setMainTypeDocument(resourceId: string|undefined) {

        if (!resourceId) return;

        if (!this.getViewState().navigationPaths[resourceId]) {
            this.getViewState().navigationPaths[resourceId] = NavigationPath.empty();
            this.notifyNavigationPathObservers();
        }
        this.getViewState().mainTypeDocumentResourceId = resourceId;
    }


    public async updateNavigationPathForDocument(document: IdaiFieldDocument) {

        this.setDisplayHierarchy(true);

        if (!NavigationPath.isPartOfNavigationPath(document, ResourcesState.getNavPath(this._),
                ResourcesState.getMainTypeDocumentResourceId(this._))) {
            await this.createNavigationPathForDocument(document);
        }
    }


    private notifyNavigationPathObservers() {

        ObserverUtil.notify(this.navigationPathObservers, ObjectUtil.cloneObject(ResourcesState.getNavPath(this._)));
    }


    private async createNavigationPathForDocument(document: IdaiFieldDocument) {

        const segments = await NavigationPath.makeSegments(document, resourceId => this.datastore.get(resourceId));
        if (segments.length == 0) return await this.moveInto(undefined);

        const navPath = NavigationPath.replaceSegmentsIfNecessary(
            ResourcesState.getNavPath(this._), segments, segments[segments.length - 1].document.resource.id);

        this._ = ResourcesState.updateNavigationPath(this._, navPath);
        this.notifyNavigationPathObservers();
    }


    private getViewState() {

        return this._.viewStates[this._.view];
    }


    private serialize() {

        this.serializer.store(ResourcesState.createObjectToSerialize(this._));
    }


    private async load(): Promise<ResourcesState> {

        let resourcesViewStates = ResourcesState.makeDefaults();

        if (this.project === 'test' ) {
            if (!this.suppressLoadMapInTestProject) resourcesViewStates = ResourcesState.makeSampleDefaults()
        } else {
            resourcesViewStates.viewStates = await this.serializer.load();
            ResourcesState.complete(resourcesViewStates);
        }

        return resourcesViewStates;
    }
}
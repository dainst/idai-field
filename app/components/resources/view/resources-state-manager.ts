import {Injectable} from '@angular/core';
import {ResourcesState} from './state/resources-state';
import {StateSerializer} from '../../../common/state-serializer';
import {OperationViews} from './state/operation-views';
import {ViewState} from './state/view-state';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ObjectUtil} from '../../../util/object-util';
import {NavigationPath} from './state/navigation-path';
import {ObserverUtil} from '../../../util/observer-util';
import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable'
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';




@Injectable()
/**
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

    public setState = (state: ResourcesState) => this._ = state;

    public resetForE2E = () => this._ = ResourcesState.makeDefaults();

    public getActiveDocumentViewTab = () => this._.activeDocumentViewTab;

    public getViewType = () => this.isInOverview() ? 'Project' : this.getOperationSubtypeForViewName(this.getView());

    public isInOverview = () => this.getView() === 'project';

    public getView = () => this._.view;

    public getViews = () => this.views.get();

    public getViewNameForOperationSubtype = (name: string) => this.views.getViewNameForOperationSubtype(name);

    public getLabelForName = (name: string) => this.views.getLabelForName(name);

    public getOperationSubtypeForViewName = (name: string) => this.views.getOperationSubtypeForViewName(name);

    public getMainTypeDocumentResourceId = (): string|undefined => this.getViewState().mainTypeDocumentResourceId;

    private serialize = () => this.serializer.store(ResourcesState.createObjectToSerialize(this._));

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this._.activeDocumentViewTab = activeDocumentViewTab;

    public getMode = () => this._.mode;

    public setMode = (mode: 'map' | 'list') => this._.mode = mode;

    public getDisplayHierarchy = (): boolean => this.getViewState().displayHierarchy;

    public getBypassOperationTypeSelection = () => this.getViewState().bypassOperationTypeSelection;

    public navigationPathNotifications = (): Observable<NavigationPath> =>
        ObserverUtil.register(this.navigationPathObservers);


    public setDisplayHierarchy(displayHierarchy: boolean) {

        this.getViewState().displayHierarchy = displayHierarchy;
        this.notify();
    }


    public setBypassOperationTypeSelection(bypassOperationTypeSelection: boolean) {

        this.getViewState().bypassOperationTypeSelection = bypassOperationTypeSelection;
        this.notify();
    }


    public setSelectedDocument(document: IdaiFieldDocument|undefined) {

        this.setNavigationPath(
            NavigationPath.setSelectedDocument(this.getNavigationPath(),
                this.getDisplayHierarchy(), document)
        );
    }


    public setQueryString(q: string) {

        this.setNavigationPath(
            NavigationPath.setQueryString(this.getNavigationPath(),
                this.getDisplayHierarchy(), q)
        );
    }


    public setTypeFilters(types: string[]) {

        this.setNavigationPath(
            NavigationPath.setTypeFilters(this.getNavigationPath(),
                this.getDisplayHierarchy(), types)
        );
    }


    public getSelectedDocument(): IdaiFieldDocument|undefined {

        return NavigationPath.getSelectedDocument(this.getNavigationPath(),
            this.getDisplayHierarchy());
    }


    public getQueryString(): string {

        return NavigationPath.getQuerySring(this.getNavigationPath(),
            this.getDisplayHierarchy());
    }


    public getTypeFilters(): string[] {

        return NavigationPath.getTypeFilters(this.getNavigationPath(),
            this.getDisplayHierarchy());
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return;

        this.getViewState().layerIds[mainTypeDocumentResourceId] = activeLayersIds.slice(0);
        this.serialize();
    }


    public getActiveLayersIds(): string[] {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return [];

        const layersIds = this.getViewState().layerIds[mainTypeDocumentResourceId];
        return layersIds ? layersIds : [];
    }


    public removeActiveLayersIds() {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return;

        delete this.getViewState().layerIds[mainTypeDocumentResourceId];
        this.serialize();
    }


    public getNavigationPath(): NavigationPath {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return NavigationPath.empty();

        const navigationPaths = this.getViewState().navigationPaths;
        const path = (navigationPaths as any)[mainTypeDocumentResourceId];

        return path ? path : NavigationPath.empty();
    }


    public setNavigationPath(navPath: NavigationPath) {

        this._ = ResourcesState.updateNavigationPath(this._, navPath);
    }


    public async moveInto(document: IdaiFieldDocument|undefined) {

        const invalidSegment = await NavigationPath.findInvalidSegment(
            this.getMainTypeDocumentResourceId(),
            this.getNavigationPath(),
            async (resourceId: string) => (await this.datastore.find({ q: '',
                constraints: { 'id:match': resourceId }})).totalCount !== 0);

        const validatedNavigationPath = invalidSegment
            ? NavigationPath.shorten(this.getNavigationPath(), invalidSegment)
            : this.getNavigationPath();

        const updatedNavigationPath = NavigationPath.setNewSelectedSegmentDoc(validatedNavigationPath, document);
        this.setNavigationPath(updatedNavigationPath);
        this.notify();
    }


    public async rebuildNavigationPath() {

        const segment = NavigationPath.getSelectedSegment(this.getNavigationPath2());
        await this.moveInto(segment ? segment.document : undefined);
    }


    public setMainTypeDocument(resourceId: string|undefined) {

        if (!resourceId) return;

        if (!this.getViewState().navigationPaths[resourceId]) {
            this.getViewState().navigationPaths[resourceId] = NavigationPath.empty();
        }
        this.getViewState().mainTypeDocumentResourceId = resourceId;
    }


    public setMainTypeDocument2(selectedMainTypeDocumentResourceId: string|undefined) {

        if (!this.getDisplayHierarchy()) this.setBypassOperationTypeSelection(false);
        if (selectedMainTypeDocumentResourceId) this.setMainTypeDocument(selectedMainTypeDocumentResourceId);
        this.notify();
    }


    public async updateNavigationPathForDocument(document: IdaiFieldDocument) {

        this.setDisplayHierarchy(true);

        if (!NavigationPath.isPartOfNavigationPath(document, this.getNavigationPath(),
                this.getMainTypeDocumentResourceId())) {
            await this.createNavigationPathForDocument(document);
        }
    }


    // TODO unit test that it returns a clone
    public getNavigationPath2(): NavigationPath {

        if (this.isInOverview()) return NavigationPath.empty();
        if (!this.getMainTypeDocumentResourceId()) return NavigationPath.empty();

        return ObjectUtil.cloneObject(this.getNavigationPath());
    }


    private notify() {

        ObserverUtil.notify(this.navigationPathObservers, this.getNavigationPath2());
    }


    private async createNavigationPathForDocument(document: IdaiFieldDocument) {

        const segments = await NavigationPath.makeSegments(document, resourceId => this.datastore.get(resourceId));
        if (segments.length == 0) return await this.moveInto(undefined);

        const navPath = NavigationPath.replaceSegmentsIfNecessary(
            this.getNavigationPath(), segments, segments[segments.length - 1].document.resource.id);

        this.setNavigationPath(navPath);
        this.notify();
    }


    private getViewState() {

        return this._.viewStates[this._.view];
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
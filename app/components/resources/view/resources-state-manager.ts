import {Injectable} from '@angular/core';
import {ResourcesState} from './state/resources-state';
import {StateSerializer} from '../../../common/state-serializer';
import {OperationViews} from './state/operation-views';
import {ViewState} from './state/view-state';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ObjectUtil} from '../../../util/object-util';
import {NavigationPath} from './state/navigation-path';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesStateManager {

    public loaded: boolean = false;

    private _: ResourcesState = ResourcesState.makeDefaults();

    constructor(
        private serializer: StateSerializer,
        private views: OperationViews,
        private additionalOverviewTypeNames: string[],
        private project: string,
        private suppressLoadMapInTestProject: boolean = false
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

    public setDisplayHierarchy = (displayHierarchy: boolean) => this.getViewState().displayHierarchy = displayHierarchy;

    public getDisplayHierarchy = (): boolean => this.getViewState().displayHierarchy;

    public setBypassOperationTypeSelection = (bypassOperationTypeSelection: boolean) => this.getViewState().bypassOperationTypeSelection = bypassOperationTypeSelection;

    public getBypassOperationTypeSelection = () => this.getViewState().bypassOperationTypeSelection;


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


    public setMainTypeDocument(resourceId: string|undefined) {

        if (!resourceId) return;

        if (!this.getViewState().navigationPaths[resourceId]) {
            this.getViewState().navigationPaths[resourceId] = NavigationPath.empty();
        }
        this.getViewState().mainTypeDocumentResourceId = resourceId;
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

    // TODO unit test that it returns a clone
    public getNavigationPath(): NavigationPath {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return NavigationPath.empty();

        const navigationPaths = this.getViewState().navigationPaths;
        const path = ObjectUtil.cloneObject(navigationPaths[mainTypeDocumentResourceId]);

        return path ? path : NavigationPath.empty();
    }


    public setNavigationPath(navPath: NavigationPath) {

        this._ = ResourcesState.updateNavigationPath(this._, navPath);
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
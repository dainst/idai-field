import {Injectable} from '@angular/core';
import {ResourcesViewState} from './resources-view-state';
import {NavigationPath} from './navigation-path';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {OperationViews} from './operation-views';
import {NavigationPathInternal, NavigationPathSegment} from './navigation-path-internal';
import {StateSerializer} from '../../../common/state-serializer';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesState {

    public loaded: boolean = false;

    private viewStates: { [viewName: string]: ResourcesViewState } = ResourcesState.makeDefaults();
    private view: string = 'project';
    private activeDocumentViewTab: string|undefined;
    private mode: 'map' | 'list' = 'map';

    constructor(
        private serializer: StateSerializer,
        private views: OperationViews,
        private additionalOverviewTypeNames: string[],
        private project: string,
        private suppressLoadMapInTestProject: boolean = false
    ) {}


    public async initialize(viewName: string): Promise<any> {

        if (!this.loaded) {
            this.viewStates = await this.load();
            this.loaded = true;
        }

        this.view = viewName;

        if (!this.viewStates[this.view]) this.viewStates[this.view] = ResourcesViewState.default();
        this.setActiveDocumentViewTab(undefined);
    }


    public getOverviewTypeNames = () => this.views.get()
        .map(_ => _.operationSubtype)
        .concat(this.additionalOverviewTypeNames);

    public resetForE2E = () => this.viewStates = ResourcesState.makeDefaults();

    public getActiveDocumentViewTab = () => this.activeDocumentViewTab;

    public getViewType = () => this.isInOverview() ? 'Project' : this.getOperationSubtypeForViewName(this.getView());

    public isInOverview = () => this.getView() == 'project';

    public getView = () => this.view;

    public getViews = () => this.views.get();

    public getViewNameForOperationSubtype = (name: string) => this.views.getViewNameForOperationSubtype(name);

    public getLabelForName = (name: string) => this.views.getLabelForName(name);

    public getOperationSubtypeForViewName = (name: string) => this.views.getOperationSubtypeForViewName(name);

    public getMainTypeDocumentResourceId = (): string|undefined => this.viewStates[this.view].mainTypeDocumentResourceId;

    public getMode = () => this.mode;

    public setMode = (mode: 'map' | 'list') => this.mode = mode;

    private serialize = () => this.serializer.store(this.createObjectToSerialize());

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this.activeDocumentViewTab = activeDocumentViewTab;

    public setSelectedDocument = (document: IdaiFieldDocument|undefined) => NavigationPathInternal.setSelectedDocument(this.getNavigationPathInternal(), document);

    public getSelectedDocument = () => NavigationPathInternal.getSelectedDocument(this.getNavigationPathInternal());

    public setQueryString = (q: string) => NavigationPathInternal.setQueryString(this.getNavigationPathInternal(), q);

    public setTypeFilters = (types: string[]) => NavigationPathInternal.setTypeFilters(this.getNavigationPathInternal(), types);

    public getQueryString = (): string => NavigationPathInternal.getQuerySring(this.getNavigationPathInternal());

    public getTypeFilters = (): string[] => NavigationPathInternal.getTypeFilters(this.getNavigationPathInternal());

    public setDisplayHierarchy = (displayHierarchy: boolean) => this.getNavigationPathInternal().displayHierarchy = displayHierarchy;

    public getDisplayHierarchy = (): boolean => this.getNavigationPathInternal().displayHierarchy;


    public setMainTypeDocument(resourceId: string|undefined) {

        if (!resourceId) return;

        if (!this.viewStates[this.view].navigationPaths[resourceId]) {
            this.viewStates[this.view].navigationPaths[resourceId] = NavigationPath.empty();
        }
        this.viewStates[this.view].mainTypeDocumentResourceId = resourceId;
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return;

        this.viewStates[this.view].layerIds[mainTypeDocumentResourceId] = activeLayersIds.slice(0);
        this.serialize();
    }


    public getActiveLayersIds(): string[] {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return [];

        const layersIds = this.viewStates[this.view].layerIds[mainTypeDocumentResourceId];
        return layersIds ? layersIds : [];
    }


    public removeActiveLayersIds() {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return;

        delete this.viewStates[this.view].layerIds[mainTypeDocumentResourceId];
        this.serialize();
    }


    public getNavigationPathInternal(): NavigationPathInternal {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return NavigationPath.empty();

        const navigationPaths = this.viewStates[this.view].navigationPaths;
        const path = (navigationPaths as any)[mainTypeDocumentResourceId];

        return path ? path : NavigationPath.empty();
    }


    public setNavigationPathInternal(navigationPathInternal: NavigationPathInternal) {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return;

        this.viewStates[this.view].navigationPaths[mainTypeDocumentResourceId] = navigationPathInternal;
    }


    private createObjectToSerialize() : { [viewName: string]: ResourcesViewState } {

        const objectToSerialize: { [viewName: string]: ResourcesViewState } = {};

        for (let viewName of Object.keys(this.viewStates)) {
            objectToSerialize[viewName] = {} as any;
            if (this.viewStates[viewName].layerIds) {
                objectToSerialize[viewName].layerIds = this.viewStates[viewName].layerIds;
            }
        }

        return objectToSerialize;
    }


    private async load(): Promise<{ [viewName: string]: ResourcesViewState }> {

        const resourcesViewStates =
            this.project === 'test'
                ? this.suppressLoadMapInTestProject
                    ? ResourcesState.makeDefaults()
                    : ResourcesState.makeSampleDefaults()
                : await this.serializer.load();

        ResourcesState.complete(resourcesViewStates);

        return resourcesViewStates;
    }


    private static makeSampleDefaults() {

        return {
            project: {
                layerIds: {'test': ['o25']}
            },
            excavation: {
                navigationPaths: {'t1': {elements: []}},
                layerIds: {'t1': ['o25']}
            }
        }
    }


    private static makeDefaults(): { [viewName: string]: ResourcesViewState } {

        return {
            excavation: ResourcesViewState.default(),
            project: ResourcesViewState.default()
        }
    }


    public static complete(viewStates: { [viewName: string]: ResourcesViewState }) {

        Object.keys(viewStates)
            .forEach(viewName => ResourcesViewState.complete(viewStates[viewName]));
    }
}
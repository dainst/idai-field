import {Injectable} from '@angular/core';
import {ViewState} from './view-state';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {OperationViews} from './operation-views';
import {NavigationPath} from './navigation-path';
import {StateSerializer} from '../../../common/state-serializer';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesState {

    public loaded: boolean = false;

    private viewStates: { [viewName: string]: ViewState } = ResourcesState.makeDefaults();
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

        if (!this.viewStates[this.view]) this.viewStates[this.view] = ViewState.default();
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

    private serialize = () => this.serializer.store(this.createObjectToSerialize());

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this.activeDocumentViewTab = activeDocumentViewTab;

    public getMode = () => this.mode;

    public setMode = (mode: 'map' | 'list') => this.mode = mode;

    public setDisplayHierarchy = (displayHierarchy: boolean) => this.viewStates[this.view].displayHierarchy = displayHierarchy;

    public getDisplayHierarchy = (): boolean => this.viewStates[this.view].displayHierarchy;


    public setSelectedDocument(document: IdaiFieldDocument|undefined) {

        NavigationPath.setSelectedDocument(this.getNavigationPath(),
            this.viewStates[this.view].displayHierarchy ,document)
    }

    public getSelectedDocument() {

        return NavigationPath.getSelectedDocument(this.getNavigationPath(),
            this.viewStates[this.view].displayHierarchy);
    }

    public setQueryString(q: string) {

        NavigationPath.setQueryString(this.getNavigationPath(),
            this.viewStates[this.view].displayHierarchy, q);
    }

    public setTypeFilters(types: string[]) {

        NavigationPath.setTypeFilters(this.getNavigationPath(),
            this.viewStates[this.view].displayHierarchy, types);
    }

    public getQueryString(): string {

        return NavigationPath.getQuerySring(this.getNavigationPath(),
            this.viewStates[this.view].displayHierarchy);
    }

    public getTypeFilters(): string[] {

        return NavigationPath.getTypeFilters(this.getNavigationPath(),
            this.viewStates[this.view].displayHierarchy);
    }


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


    public getNavigationPath(): NavigationPath {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return NavigationPath.empty();

        const navigationPaths = this.viewStates[this.view].navigationPaths;
        const path = (navigationPaths as any)[mainTypeDocumentResourceId];

        return path ? path : NavigationPath.empty();
    }


    public setNavigationPath(navigationPathInternal: NavigationPath) {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return;

        this.viewStates[this.view].navigationPaths[mainTypeDocumentResourceId] = navigationPathInternal;
    }


    private createObjectToSerialize() : { [viewName: string]: ViewState } {

        const objectToSerialize: { [viewName: string]: ViewState } = {};

        for (let viewName of Object.keys(this.viewStates)) {
            objectToSerialize[viewName] = {} as any;
            if (this.viewStates[viewName].layerIds) {
                objectToSerialize[viewName].layerIds = this.viewStates[viewName].layerIds;
            }
        }

        return objectToSerialize;
    }


    private async load(): Promise<{ [viewName: string]: ViewState }> {

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


    private static makeDefaults(): { [viewName: string]: ViewState } {

        return {
            excavation: ViewState.default(),
            project: ViewState.default()
        }
    }


    public static complete(viewStates: { [viewName: string]: ViewState }) {

        Object.keys(viewStates)
            .forEach(viewName => ViewState.complete(viewStates[viewName]));
    }
}
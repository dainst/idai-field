import {Injectable} from '@angular/core';
import {ViewState} from './view-state';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {OperationViews} from './operation-views';
import {StateSerializer} from '../../../../common/state-serializer';
import {NavigationPath} from '../navpath/navigation-path';
import {ObjectUtil} from '../../../../util/object-util';


interface State { // 'the' resources state

    viewStates: { [viewName: string]: ViewState };
    view: string;
    mode: 'map' | 'list';
    activeDocumentViewTab: string|undefined;
}


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesState {

    public loaded: boolean = false;

    private _: State = {
        viewStates: ResourcesState.makeDefaults(), // TODO make defaults for the whole State
        view: 'project',
        mode: 'map',
        activeDocumentViewTab: undefined
    };

    constructor(
        private serializer: StateSerializer,
        private views: OperationViews,
        private additionalOverviewTypeNames: string[],
        private project: string,
        private suppressLoadMapInTestProject: boolean = false
    ) {}


    public async initialize(viewName: string): Promise<any> {

        if (!this.loaded) {
            this._.viewStates = await this.load();
            this.loaded = true;
        }

        this._.view = viewName;

        if (!this.getViewState()) this._.viewStates[this._.view] = ViewState.default();
        this.setActiveDocumentViewTab(undefined);
    }


    public getOverviewTypeNames = () => this.views.get()
        .map(_ => _.operationSubtype)
        .concat(this.additionalOverviewTypeNames);

    public setState = (state: State) => this._ = state;

    public resetForE2E = () => this._.viewStates = ResourcesState.makeDefaults();

    public getActiveDocumentViewTab = () => this._.activeDocumentViewTab;

    public getViewType = () => this.isInOverview() ? 'Project' : this.getOperationSubtypeForViewName(this.getView());

    public isInOverview = () => this.getView() === 'project';

    public getView = () => this._.view;

    public getViews = () => this.views.get();

    public getViewNameForOperationSubtype = (name: string) => this.views.getViewNameForOperationSubtype(name);

    public getLabelForName = (name: string) => this.views.getLabelForName(name);

    public getOperationSubtypeForViewName = (name: string) => this.views.getOperationSubtypeForViewName(name);

    public getMainTypeDocumentResourceId = (): string|undefined => this.getViewState().mainTypeDocumentResourceId;

    private serialize = () => this.serializer.store(this.createObjectToSerialize());

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this._.activeDocumentViewTab = activeDocumentViewTab;

    public getMode = () => this._.mode;

    public setMode = (mode: 'map' | 'list') => this._.mode = mode;

    public setDisplayHierarchy = (displayHierarchy: boolean) => this.getViewState().displayHierarchy = displayHierarchy;

    public getDisplayHierarchy = (): boolean => this.getViewState().displayHierarchy;

    public setBypassOperationTypeSelection = (bypassOperationTypeSelection: boolean) => this.getViewState().bypassOperationTypeSelection = bypassOperationTypeSelection;

    public getBypassOperationTypeSelection = () => this.getViewState().bypassOperationTypeSelection;


    public setSelectedDocument(document: IdaiFieldDocument|undefined) {

        this._ = this.setNavigationPath(
            NavigationPath.setSelectedDocument(this.getNavigationPath(),
                this.getDisplayHierarchy(), document)
        );
    }


    public setQueryString(q: string) {

        this._ = this.setNavigationPath(
            NavigationPath.setQueryString(this.getNavigationPath(),
                this.getDisplayHierarchy(), q)
        );
    }


    public setTypeFilters(types: string[]) {

        this._ = this.setNavigationPath(
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


    public getNavigationPath(): NavigationPath {

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return NavigationPath.empty();

        const navigationPaths = this.getViewState().navigationPaths;
        const path = (navigationPaths as any)[mainTypeDocumentResourceId];

        return path ? path : NavigationPath.empty();
    }


    public setNavigationPath(navPath: NavigationPath): State {

        const clone = ObjectUtil.cloneObject(this._);

        const mainTypeDocumentResourceId = this.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) return clone;

        clone.viewStates[clone.view].navigationPaths[mainTypeDocumentResourceId] = navPath;
        return clone;
    }


    private getViewState() {

        return this._.viewStates[this._.view];
    }


    private createObjectToSerialize() : { [viewName: string]: ViewState } {

        const objectToSerialize: { [viewName: string]: ViewState } = {};

        for (let viewName of Object.keys(this._.viewStates)) {
            objectToSerialize[viewName] = {} as any;
            if (this._.viewStates[viewName].layerIds) {
                objectToSerialize[viewName].layerIds = this._.viewStates[viewName].layerIds;
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
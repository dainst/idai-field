import {Injectable} from '@angular/core';
import {ResourcesViewState} from './resources-view-state';
import {NavigationPath} from './navigation-path';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {OperationViews} from './operation-views';
import {NavigationPathInternal, NavigationPathSegment} from './navigation-path-internal';
import {StateSerializer} from "../../../common/state-serializer";


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesState {

    private viewStates: { [viewName: string]: ResourcesViewState } = ResourcesState.makeDefaults();
    private view: string = 'project';
    public loaded = false;
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

    public getMainTypeDocument = (): IdaiFieldDocument|undefined => this.viewStates[this.view].mainTypeDocument;

    public getMode = () => this.mode;

    public setMode = (mode: 'map' | 'list') => this.mode = mode;

    private serialize = () => this.serializer.store(this.createObjectToSerialize());

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this.activeDocumentViewTab = activeDocumentViewTab;


    public setMainTypeDocument(document: IdaiFieldDocument|undefined) {

        if (document && !this.viewStates[this.view].navigationPaths[document.resource.id]) {
            this.viewStates[this.view].navigationPaths[document.resource.id] = NavigationPath.empty();
        }

        this.viewStates[this.view].mainTypeDocument = document;
    }


    public setSelectedDocument(document: IdaiFieldDocument|undefined) {

        this.withNavPath(
            navPath => this.getRootSegment(navPath).selected = document,
            navPath => navPath.selected = document
        );
    }


    public getSelectedDocument() {

        return this.withNavPath(
            navPath => this.getRootSegment(navPath).selected,
            navPath => navPath.selected
        );
    }


    public setQueryString(q: string) {

        this.withNavPath(
            navPath => this.getRootSegment(navPath).q = q,
            navPath => navPath.q = q
        );
    }


    public setTypeFilters(types: string[]) {

        this.withNavPath(
            navPath => this.getRootSegment(navPath).types = types,
            navPath => navPath.types = types
        );
    }


    public getQueryString(): string {

        return this.withNavPath(
            navPath => this.getRootSegment(navPath).q,
            navPath => navPath.q
        );
    }


    public getTypeFilters(): string[] {

        return this.withNavPath(
            navPath => this.getRootSegment(navPath).types,
            navPath => navPath.types
        );
    }


    private getRootSegment(navigationPath: NavigationPathInternal) {

        return navigationPath.elements.find(element =>
            element.document.resource.id ==
                (navigationPath.rootDocument as IdaiFieldDocument).resource.id)as NavigationPathSegment;
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return;

        this.viewStates[this.view].layerIds[mainTypeDocument.resource.id] = activeLayersIds.slice(0);
        this.serialize();
    }


    public getActiveLayersIds(): string[] {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return [];

        const layersIds = this.viewStates[this.view].layerIds[mainTypeDocument.resource.id];
        return layersIds ? layersIds : [];
    }


    public removeActiveLayersIds() {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return;

        delete this.viewStates[this.view].layerIds[mainTypeDocument.resource.id];
        this.serialize();
    }


    public getNavigationPathInternal(): NavigationPathInternal {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return NavigationPath.empty();

        const navigationPaths = this.viewStates[this.view].navigationPaths;
        const path = (navigationPaths as any)[mainTypeDocument.resource.id];

        return path ? path : NavigationPath.empty();
    }


    public setNavigationPathInternal(navigationPathInternal: NavigationPathInternal) {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return;

        this.viewStates[this.view].navigationPaths[mainTypeDocument.resource.id] = navigationPathInternal;
    }


    private createObjectToSerialize() : { [viewName: string]: ResourcesViewState } {

        const objectToSerialize: { [viewName: string]: ResourcesViewState } = {};

        for (let viewName of Object.keys(this.viewStates)) {
            objectToSerialize[viewName] = {} as any;
            if (this.viewStates[viewName].layerIds) objectToSerialize[viewName].layerIds = this.viewStates[viewName].layerIds;
        }

        return objectToSerialize;
    }


    private withNavPath(doWhenRootExists: (n: NavigationPathInternal) => any,
                        doWhenRootNotExists: (n: NavigationPathInternal) => any) {

        const navigationPath = this.getNavigationPathInternal();

        return navigationPath.rootDocument
            ? doWhenRootExists(navigationPath)
            : doWhenRootNotExists(navigationPath);
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
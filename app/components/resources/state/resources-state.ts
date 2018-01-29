import {Injectable} from '@angular/core';
import {ResourcesViewState} from './resources-view-state';
import {StateSerializer} from '../../../common/state-serializer';
import {NavigationPath} from './navigation-path';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {OperationViews} from './operation-views';
import {NavigationPathInternal, NavigationPathSegment, toDocument} from './navigation-path-internal';


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

    constructor(
        private serializer: StateSerializer,
        private views: OperationViews,
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


    public resetForE2E = () => this.viewStates = ResourcesState.makeDefaults();

    public getActiveDocumentViewTab = () => this.activeDocumentViewTab;

    public getViewType = () => this.isInOverview() ? 'Project' : this.getTypeForName(this.getView());

    public isInOverview = () => this.getView() == 'project';

    public getView = () => this.view;

    public getViews = () => this.views.get();

    public getViewNameForOperationSubtype = (name: string) => this.views.getViewNameForOperationSubtype(name);

    public getLabelForName = (name: string) => this.views.getLabelForName(name);

    public getTypeForName = (name: string) => this.views.getTypeForName(name);

    public getMainTypeDocument = (): IdaiFieldDocument|undefined => this.viewStates[this.view].mainTypeDocument;

    public getMode = () => this.viewStates[this.view].mode;

    public setMode = (mode: string) => this.viewStates[this.view].mode = mode;

    private serialize = () => this.serializer.store(StateSerializer.RESOURCES_STATE, this.createObjectToSerialize());

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this.activeDocumentViewTab = activeDocumentViewTab;


    public setMainTypeDocument(document: IdaiFieldDocument|undefined) {

        if (document && !this.viewStates[this.view].navigationPaths[document.resource.id as string]) {
            this.viewStates[this.view].navigationPaths[document.resource.id as string] = NavigationPath.empty();
        }

        this.viewStates[this.view].mainTypeDocument = document;
    }


    public setQueryString(q: string) {

        this.withNavPath(
                navPath => !q ? this.getRootSegment(navPath).q = ''
                    : this.getRootSegment(navPath).q = q,
                navPath => !q ? navPath.q = ''
                    : navPath.q = q
            );
    }


    /**
     * @param types set undefined to erase types for current element
     */
    public setTypeFilters(types: string[]|undefined) {

        this.withNavPath(
                navPath => !types ? delete this.getRootSegment(navPath).types
                        : this.getRootSegment(navPath).types = types,
                navPath => !types ? delete navPath.types
                        : navPath.types = types
            );
    }


    public getQueryString(): string {

        const q = this.withNavPath(
                navPath => this.getRootSegment(navPath).q,
                navPath => navPath.q
            );
        return q ? q : '';
    }


    private getRootSegment(navigationPath: NavigationPathInternal) {

        return navigationPath.elements.find(element =>
            element.document.resource.id ==
                (navigationPath.rootDocument as IdaiFieldDocument).resource.id)as NavigationPathSegment;
    }


    public getTypeFilters(): string[]|undefined {

        return this.withNavPath(
                navPath => this.getRootSegment(navPath).types,
                navPath => navPath.types
            ) as string[]|undefined;
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return;

        this.viewStates[this.view].layerIds[mainTypeDocument.resource.id as string] = activeLayersIds.slice(0);
        this.serialize();
    }


    public getActiveLayersIds(): string[] {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return [];

        const layersIds = this.viewStates[this.view].layerIds[mainTypeDocument.resource.id as string];
        return layersIds ? layersIds : [];
    }


    public removeActiveLayersIds() {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return;

        delete this.viewStates[this.view].layerIds[mainTypeDocument.resource.id as string];
        this.serialize();
    }


    public getNavigationPath(): NavigationPath {

        if (this.isInOverview()) return NavigationPath.empty();

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return NavigationPath.empty();

        return {
            elements: this.getNavigationPathInternal().elements.map(toDocument),
            rootDocument: this.getNavigationPathInternal().rootDocument
        }
    }


    public getNavigationPathInternal(): NavigationPathInternal {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return NavigationPath.empty();

        const navigationPaths = this.viewStates[this.view].navigationPaths;
        const path = (navigationPaths as any)[mainTypeDocument.resource.id as string];

        return path ? path : NavigationPath.empty();
    }


    public setNavigationPathInternal(navigationPathInternal: NavigationPathInternal) {

        const mainTypeDocument = this.getMainTypeDocument();
        if (!mainTypeDocument) return;

        this.viewStates[this.view].navigationPaths[mainTypeDocument.resource.id as string] = navigationPathInternal;
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


    private async load() {

        const resourcesViewStates =
            this.project === 'test'
                ? this.suppressLoadMapInTestProject
                    ? ResourcesState.makeDefaults()
                    : ResourcesState.makeSampleDefaults()
                : await this.serializer.load(StateSerializer.RESOURCES_STATE);

        return ResourcesViewState.complete(resourcesViewStates as { [viewName: string]: ResourcesViewState });
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
}
import {Injectable} from '@angular/core';
import {ResourcesViewState} from './resources-view-state';
import {StateSerializer} from '../../../common/state-serializer';
import {NavigationPath} from './navigation-path';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {OperationViews} from './operation-views';
import {NavigationPathInternal, NavigationPathSegment} from './navigation-path-internal';
import {includedIn, takeUntil} from '../../../util/list-util';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesState {

    private viewStates: { [viewName: string]: ResourcesViewState };

    private view: string;

    private activeDocumentViewTab: string|undefined;


    constructor(
        private serializer: StateSerializer,
        private views: OperationViews
    ) {
        this.setView('project');
    }


    public resetForE2E() {

        this.viewStates = { [this.view]: ResourcesViewState.default() };
    }


    public async initialize(defaultMode?: string): Promise<any> {

        if (this.viewStates) return Promise.resolve();

        this.viewStates = await this.serializer.load(StateSerializer.RESOURCES_STATE);

        this.initializeMode(defaultMode);
        this.setActiveDocumentViewTab(undefined);
    }


    public async setView(name: string) {

        if (!name) return;
        this.view = name;
        if (!this.viewStates) this.viewStates = {};
        if (!this.viewStates[this.view]) this.viewStates[this.view] = ResourcesViewState.default();
    }


    public getActiveDocumentViewTab(): string|undefined {

        return this.activeDocumentViewTab;
    }


    public setActiveDocumentViewTab(activeDocumentViewTab: string|undefined) {

        this.activeDocumentViewTab = activeDocumentViewTab;
    }


    public isInOverview() {

        return this.getView() == 'project';
    }


    public getView() {

        return this.view;
    }


    public getViewType() {

        if (this.isInOverview()) return 'Project';
        return this.getTypeForName(this.getView());
    }


    public getViews() {

        return this.views.get();
    }


    public getViewNameForOperationSubtype(name: string) {

        return this.views.getViewNameForOperationSubtype(name);
    }


    public getLabelForName(name: string) {

        return this.views.getLabelForName(name);
    }


    public getTypeForName(name: string) {

        return this.views.getTypeForName(name);
    }


    public setMainTypeDocument(document: IdaiFieldDocument|undefined) {

        if (document && !this.viewStates[this.view].navigationPaths[document.resource.id as string]) {
            this.viewStates[this.view].navigationPaths[document.resource.id as string] = NavigationPath.empty();
        }

        this.viewStates[this.view].mainTypeDocument = document;
    }


    public getMainTypeDocument(): IdaiFieldDocument|undefined {

        if (!this.viewStates[this.view].mainTypeDocument) return undefined;

        return this.viewStates[this.view].mainTypeDocument;
    }


    public setMode(mode: string) {

        this.viewStates[this.view].mode = mode;
        this.serialize();
    }


    public getMode(): string|undefined {

        return (!this.viewStates[this.view] || !this.viewStates[this.view].mode) ? 'map' : this.viewStates[this.view].mode;
    }


    public setQueryString(q: string) {

        this.viewStates[this.view].q = q;
        this.serialize();
    }


    public getQueryString() {

        return (!this.viewStates[this.view] || !this.viewStates[this.view].q) ? '' : this.viewStates[this.view].q;
    }


    /**
     * @param types set undefined to erase types for current element
     */
    public setTypeFilters(types: string[]|undefined) {

        const navigationPath = this.getCurrentNavigationPath();
        if (!navigationPath) return;

        if (navigationPath.rootDocument) {
            const element: NavigationPathSegment
                = navigationPath.elements.find(element =>
                element.document.resource.id == (navigationPath.rootDocument as IdaiFieldDocument).resource.id) as NavigationPathSegment;
            if (!types) {
                delete element.types;
            } else {
                element.types = types;
            }
        } else { // mainTypeDocument selected
            if (!types) {
                delete navigationPath.types;
            } else {
                navigationPath.types = types;
            }
        }
    }


    private getCurrentNavigationPath(): NavigationPathInternal|undefined {

        const resourcesViewState = this.viewStates[this.view];
        if (!resourcesViewState.mainTypeDocument) return;

        return resourcesViewState.navigationPaths[
                resourcesViewState.mainTypeDocument.resource.id as string
            ];
    }


    public getTypeFilters(): string[]|undefined {

        const navigationPath = this.getCurrentNavigationPath();
        if (!navigationPath) return;

        if (navigationPath.rootDocument) {
            const element: NavigationPathSegment
                = navigationPath.elements.find(element =>
                element.document.resource.id == (navigationPath.rootDocument as IdaiFieldDocument).resource.id) as NavigationPathSegment;
            return element.types;
        } else {
            return navigationPath.types;
        }
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        if (!this.viewStates[this.view].layerIds) this.viewStates[this.view].layerIds = {};

        const layerIds = this.viewStates[this.view].layerIds;
        if (!layerIds) return;

        if (this.viewStates[this.view].mainTypeDocument && (this.viewStates[this.view].mainTypeDocument as any).resource.id) {

            layerIds[(this.viewStates[this.view].mainTypeDocument as any).resource.id] = activeLayersIds.slice(0);
            this.serialize();
        }
    }


    public getActiveLayersIds(): string[] {

        if (!this.viewStates[this.view] || !this.viewStates[this.view].layerIds) return [];

        const layerIds = this.viewStates[this.view].layerIds;
        if (!layerIds) return [];

        if (this.viewStates[this.view].mainTypeDocument && (this.viewStates[this.view].mainTypeDocument as any).resource.id) {
            return layerIds[(this.viewStates[this.view].mainTypeDocument as any)];
        } else {
            return [];
        }
    }


    public removeActiveLayersIds() {

        if (!this.viewStates[this.view] || !this.viewStates[this.view].layerIds) return;

        const layerIds = this.viewStates[this.view].layerIds;
        if (!layerIds) return;

        if (this.viewStates[this.view].mainTypeDocument && (this.viewStates[this.view].mainTypeDocument as any).resource.id) {
            delete layerIds[(this.viewStates[this.view].mainTypeDocument as any)];
            this.serialize();
        }
    }


    /**
     * @param document set undefined to make rootElement of navigation path undefined
     */
    public moveInto(document: IdaiFieldDocument|undefined) {

        if (!this.viewStates[this.view].navigationPaths) this.viewStates[this.view].navigationPaths = {};

        const operationTypeDocument = this.getMainTypeDocument();
        if (!operationTypeDocument) return;

        const navigationPath = ResourcesState.makeNewNavigationPath(
            this.getNavigationPathInternal(operationTypeDocument), document);

        const navigationPaths = this.viewStates[this.view].navigationPaths;

        navigationPaths[(operationTypeDocument as any).resource.id] = navigationPath;
    }


    public getNavigationPath(): NavigationPath {

        if (this.isInOverview()) return NavigationPath.empty();
        if (!this.viewStates[this.view] || !this.viewStates[this.view].navigationPaths) return NavigationPath.empty();

        const operationTypeDocument = this.getMainTypeDocument();
        if (!operationTypeDocument) return NavigationPath.empty();

        const navigationPath: NavigationPath = { elements: [] };
        const navigationPathInternal = this.getNavigationPathInternal(operationTypeDocument);
        if (navigationPathInternal.rootDocument) navigationPath.rootDocument = navigationPathInternal.rootDocument;

        navigationPathInternal.elements
            .forEach(segment => navigationPath.elements.push(segment.document));

        return navigationPath;
    }


    private getNavigationPathInternal(operationTypeDocument: IdaiFieldDocument): NavigationPathInternal {

        const navigationPaths = this.viewStates[this.view].navigationPaths;
        const path = (navigationPaths as any)[operationTypeDocument.resource.id as string];

        return path ? path : NavigationPath.empty();
    }


    private initializeMode(defaultMode?: string) {

        if (defaultMode) {
            return this.setMode(defaultMode);
        }
        if (!this.getMode()) {
            this.setMode('map');
        }
    }


    private serialize() {

        this.serializer.store(StateSerializer.RESOURCES_STATE, this.createObjectToSerialize());
    }


    private createObjectToSerialize() : { [viewName: string]: ResourcesViewState } {

        const objectToSerialize: { [viewName: string]: ResourcesViewState } = {};

        for (let viewName of Object.keys(this.viewStates)) {
            objectToSerialize[viewName] = {} as any;
            // if (this._[viewName].mainTypeDocumentId) { // TODO comment in and also make sure loading works properly
            //     objectToSerialize[viewName].mainTypeDocumentId = this._[viewName].mainTypeDocumentId;
            // }
            //if (this._[viewName].mode) objectToSerialize[viewName].mode = this._[viewName].mode;
            if (this.viewStates[viewName].layerIds) objectToSerialize[viewName].layerIds = this.viewStates[viewName].layerIds;
        }

        return objectToSerialize;
    }


    private static makeNewNavigationPath(
        oldNavigationPath: NavigationPathInternal,
        newRootDocument: IdaiFieldDocument|undefined): NavigationPathInternal {

        return (newRootDocument)
            ? {
                elements: this.rebuildElements(
                    oldNavigationPath.elements,
                    oldNavigationPath.rootDocument,
                    newRootDocument),
                rootDocument: newRootDocument,
                q: oldNavigationPath.q,
                types: oldNavigationPath.types
            }
            : {
                elements: oldNavigationPath.elements,
                // rootDocument <- undefined, because no document
                q: oldNavigationPath.q,
                types: oldNavigationPath.types
            }
    }


    private static rebuildElements(oldElements: Array<NavigationPathSegment>, oldRoot: IdaiFieldDocument|undefined,
                                   newRoot: IdaiFieldDocument) {

        if (includedIn(oldElements.map(toDocument))(newRoot)) return oldElements;

        return (oldRoot ? takeUntil(isSameSegment(oldRoot))(oldElements) : []).concat([{document: newRoot}]);
    }
}


const toDocument = (segment: NavigationPathSegment) => segment.document;

const isSameSegment = (document: IdaiFieldDocument) => (segment: NavigationPathSegment) => document == segment.document;
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

        if (defaultMode) this.setMode(defaultMode);
        this.setActiveDocumentViewTab(undefined);
    }


    public async setView(name: string) {

        if (!name) return;
        this.view = name;
        if (!this.viewStates) this.viewStates = {};
        if (!this.viewStates[this.view]) this.viewStates[this.view] = ResourcesViewState.default();
    }


    public setActiveDocumentViewTab(activeDocumentViewTab: string|undefined) {

        this.activeDocumentViewTab = activeDocumentViewTab;
    }


    public getActiveDocumentViewTab = (): string|undefined => this.activeDocumentViewTab;


    public getViewType = () => this.isInOverview() ? 'Project' : this.getTypeForName(this.getView());


    public isInOverview = () => this.getView() == 'project';


    public getView = () => this.view;


    public getViews = () => this.views.get();


    public getViewNameForOperationSubtype = (name: string) => this.views.getViewNameForOperationSubtype(name);


    public getLabelForName = (name: string) => this.views.getLabelForName(name);


    public getTypeForName = (name: string) => this.views.getTypeForName(name);


    public getMainTypeDocument = (): IdaiFieldDocument|undefined => this.viewStates[this.view].mainTypeDocument;


    public getMode = () => this.viewStates[this.view].mode;


    public getQueryString = () => this.viewStates[this.view].q;


    public setMode(mode: string) {

        this.viewStates[this.view].mode = mode;
        this.serialize();
    }


    public setMainTypeDocument(document: IdaiFieldDocument|undefined) {

        if (this.isInOverview()) return;

        this.viewStates[this.view].mainTypeDocument = document;

        if (document && !this.viewStates[this.view].navigationPaths[document.resource.id as string]) {
            this.viewStates[this.view].navigationPaths[document.resource.id as string] = NavigationPath.empty();
        }
    }


    public setQueryString(q: string) {

        this.viewStates[this.view].q = q;
        this.serialize();
    }


    /**
     * @param types set undefined to erase types for current element
     */
    public setTypeFilters(types: string[]|undefined) {

        const navigationPath = this.getCurrentNavigationPath();
        if (!navigationPath) return;

        if (navigationPath.rootDocument) {
            if (!types) {
                delete this.getRootSegment(navigationPath).types;
            } else {
                this.getRootSegment(navigationPath).types = types;
            }
        } else {
            if (!types) {
                delete navigationPath.types;
            } else {
                navigationPath.types = types;
            }
        }
    }


    private getRootSegment(navigationPath: NavigationPathInternal) {

        return navigationPath.elements.find(element =>
            element.document.resource.id ==
                (navigationPath.rootDocument as IdaiFieldDocument).resource.id)as NavigationPathSegment;
    }


    public getTypeFilters(): string[]|undefined {

        const navigationPath = this.getCurrentNavigationPath();
        if (!navigationPath) return;

        return (navigationPath.rootDocument)
            ? this.getRootSegment(navigationPath).types
            : navigationPath.types;
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        if (this.viewStates[this.view].mainTypeDocument && (this.viewStates[this.view].mainTypeDocument as any).resource.id) {
            this.viewStates[this.view].layerIds[(this.viewStates[this.view].mainTypeDocument as any).resource.id] = activeLayersIds.slice(0);
            this.serialize();
        }
    }


    public getActiveLayersIds(): string[] {

        if (this.viewStates[this.view].mainTypeDocument && (this.viewStates[this.view].mainTypeDocument as any).resource.id) {
            return this.viewStates[this.view].layerIds[(this.viewStates[this.view].mainTypeDocument as any)];
        } else {
            return [];
        }
    }


    public removeActiveLayersIds() {

        if (this.viewStates[this.view].mainTypeDocument && (this.viewStates[this.view].mainTypeDocument as any).resource.id) {
            delete this.viewStates[this.view].layerIds[(this.viewStates[this.view].mainTypeDocument as any)];
            this.serialize();
        }
    }


    /**
     * @param document set undefined to make rootElement of navigation path undefined
     */
    public moveInto(document: IdaiFieldDocument|undefined) {

        const operationTypeDocument = this.getMainTypeDocument();
        if (!operationTypeDocument) return;

        this.viewStates[this.view].navigationPaths[
            operationTypeDocument.resource.id as string] = ResourcesState.makeNewNavigationPath(
                this.getNavigationPathInternal(operationTypeDocument), document);
    }


    public getNavigationPath(): NavigationPath {

        if (this.isInOverview()) return NavigationPath.empty();

        const operationTypeDocument = this.getMainTypeDocument();
        if (!operationTypeDocument) return NavigationPath.empty();

        return {
            elements: this.getNavigationPathInternal(operationTypeDocument).elements.map(toDocument),
            rootDocument: this.getNavigationPathInternal(operationTypeDocument).rootDocument
        }
    }


    private getNavigationPathInternal(operationTypeDocument: IdaiFieldDocument): NavigationPathInternal {

        const navigationPaths = this.viewStates[this.view].navigationPaths;
        const path = (navigationPaths as any)[operationTypeDocument.resource.id as string];

        return path ? path : NavigationPath.empty();
    }


    private getCurrentNavigationPath(): NavigationPathInternal|undefined {

        const resourcesViewState = this.viewStates[this.view];
        if (!resourcesViewState.mainTypeDocument) return;

        return resourcesViewState.navigationPaths[
                resourcesViewState.mainTypeDocument.resource.id as string
            ];
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
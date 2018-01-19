import {Injectable} from '@angular/core';
import {ResourcesViewState} from './resources-view-state';
import {StateSerializer} from '../../../common/state-serializer';
import {NavigationPath} from './navigation-path';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {OperationViews} from './operation-views';
import {NavigationPathInternal, NavigationPathSegment} from './navigation-path-internal';
import {contains, takeUntil} from "../../../util/list-util";


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ResourcesState {

    private _: { [viewName: string]: ResourcesViewState };

    private view: string = 'project';

    private activeDocumentViewTab: string|undefined;


    constructor(
        private serializer: StateSerializer,
        private views: OperationViews
    ) {}


    public resetForE2E() {

        this._ = { };
    }


    public async initialize(defaultMode?: string): Promise<any> {

        if (this._) return Promise.resolve();

        this._ = await this.serializer.load(StateSerializer.RESOURCES_STATE)

        this.initializeMode(defaultMode);
        this.setActiveDocumentViewTab(undefined);
    }


    public async setView(name: string) {

        if (!name) return;
        this.view = name;
        if (!this._) this._ = {};
        if (!this._[this.view]) this._[this.view] = { mode: 'map'};
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

        if (!this.view) return;
        if (!this._) return;
        if (!this._[this.view]) return;

        this._[this.view].mainTypeDocument = document;
    }


    public getMainTypeDocument(): IdaiFieldDocument|undefined {

        if (!this.view) return undefined;
        if (!this._) return undefined;
        if (!this._[this.view]) return undefined;
        if (!this._[this.view].mainTypeDocument) return undefined;

        return this._[this.view].mainTypeDocument;
    }


    public setMode(mode: string) {

        if (!this._[this.view]) this._[this.view] = {};
        this._[this.view].mode = mode;
        this.serialize();
    }


    public getMode(): string|undefined {

        if (!this._) return 'map';
        return (!this._[this.view] || !this._[this.view].mode) ? 'map' : this._[this.view].mode;
    }


    public setQueryString(q: string) {

        if (!this._[this.view]) this._[this.view] = {};
        this._[this.view].q = q;
        this.serialize();
    }


    public getQueryString() {

        if (!this._) return '';
        return (!this._[this.view] || !this._[this.view].q) ? '' : this._[this.view].q;
    }


    public setTypeFilters(types: string[]) {

        if (!this._[this.view]) this._[this.view] = {};

        if (types && types.length > 0) {
            this._[this.view].types = types;
        } else {
            if (this._[this.view])  delete this._[this.view].types;
        }
    }


    public getTypeFilters(): string[]|undefined {

        if (!this._) return undefined;
        return (!this._[this.view]) ? undefined : this._[this.view].types;
    }


    public setActiveLayersIds(activeLayersIds: string[]) {

        if (!this._[this.view]) this._[this.view] = {};
        if (!this._[this.view].layerIds) this._[this.view].layerIds = {};

        const layerIds = this._[this.view].layerIds;
        if (!layerIds) return;

        if (this._[this.view].mainTypeDocument && (this._[this.view].mainTypeDocument as any).resource.id) {

            layerIds[(this._[this.view].mainTypeDocument as any).resource.id] = activeLayersIds.slice(0);
            this.serialize();
        }
    }


    public getActiveLayersIds(): string[] {

        if (!this._[this.view] || !this._[this.view].layerIds) return [];

        const layerIds = this._[this.view].layerIds;
        if (!layerIds) return [];

        if (this._[this.view].mainTypeDocument && (this._[this.view].mainTypeDocument as any).resource.id) {
            return layerIds[(this._[this.view].mainTypeDocument as any)];
        } else {
            return [];
        }
    }


    public removeActiveLayersIds() {

        if (!this._[this.view] || !this._[this.view].layerIds) return;

        const layerIds = this._[this.view].layerIds;
        if (!layerIds) return;

        if (this._[this.view].mainTypeDocument && (this._[this.view].mainTypeDocument as any).resource.id) {
            delete layerIds[(this._[this.view].mainTypeDocument as any)];
            this.serialize();
        }
    }


    /**
     * @param document set undefined to make rootElement of navigation path undefined
     */
    public moveInto(document: IdaiFieldDocument|undefined) {

        if (!this._[this.view]) this._[this.view] = {};
        if (!this._[this.view].navigationPaths) this._[this.view].navigationPaths = {};

        const operationTypeDocument = this.getMainTypeDocument();
        if (operationTypeDocument) {

            const navigationPath = ResourcesState.makeNewNavigationPath(
                this.getNavigationPathInternal(operationTypeDocument), document);

            const navigationPaths = this._[this.view].navigationPaths;
            if (!navigationPaths) return;

            navigationPaths[(operationTypeDocument as any).resource.id] = navigationPath;
        }
    }


    public getNavigationPath(): NavigationPath {

        if (this.isInOverview()) return NavigationPath.empty();
        if (!this._[this.view] || !this._[this.view].navigationPaths) return NavigationPath.empty();

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

        const navigationPaths = this._[this.view].navigationPaths;
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

        for (let viewName of Object.keys(this._)) {
            objectToSerialize[viewName] = {};
            // if (this._[viewName].mainTypeDocumentId) { // TODO comment in and also make sure loading works properly
            //     objectToSerialize[viewName].mainTypeDocumentId = this._[viewName].mainTypeDocumentId;
            // }
            //if (this._[viewName].mode) objectToSerialize[viewName].mode = this._[viewName].mode;
            if (this._[viewName].layerIds) objectToSerialize[viewName].layerIds = this._[viewName].layerIds;
        }

        return objectToSerialize;
    }


    private static makeNewNavigationPath(
        oldNavigationPath: NavigationPathInternal,
        document: IdaiFieldDocument|undefined): NavigationPathInternal {

        return (document)
            ? {
                elements: this.rebuildElements(
                    oldNavigationPath.elements,
                    oldNavigationPath.rootDocument,
                    document),
                rootDocument: document
            }
            : {
                elements: oldNavigationPath.elements
                // rootDocument <- undefined, because no document
            }
    }


    private static rebuildElements(oldElements: Array<NavigationPathSegment>, oldRoot: IdaiFieldDocument|undefined,
                                   newRoot: IdaiFieldDocument) {

        if (contains(newRoot)(oldElements.map(toDocument))) return oldElements;

        return (oldRoot ? takeUntil(isSameSegment(oldRoot))(oldElements) : []).concat([{document: newRoot}]);
    }
}

const toDocument = (segment: NavigationPathSegment) => segment.document;


const isSameSegment = (document: IdaiFieldDocument) => (segment: NavigationPathSegment) => document == segment.document;
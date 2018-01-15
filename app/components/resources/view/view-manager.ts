import {Resource} from 'idai-components-2/core';
import {Query} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {OperationViews} from './operation-views';
import {ResourcesState} from './resources-state';

/**
 * Holds and provides access to the current view, which is one of the views from this.views,
 * as well as serializes all of its state so it can be restored later.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ViewManager {

    private mode: string|undefined; // 'map' or 'list' or undefined
    private query: Query;
    private mainTypeLabel: string;
    private activeDocumentViewTab: string|undefined;

    private currentView: string;


    constructor(
        private views: OperationViews,
        private resourcesState: ResourcesState) {
    }


    public isInOverview() {

        return this.currentView == 'project';
    }


    public getViewName() {

        return this.currentView;
    }


    public getCurrentFilterType()  {

        const filterTypes = this.getFilterTypes();
        if (!filterTypes) return undefined;

        return (filterTypes.length > 0 ?
            filterTypes[0] : undefined);
    }


    public setMode(mode: string) {

        this.mode = mode;
        this.setLastSelectedMode(mode);
    }


    public getMode() {

        return this.mode;
    }


    public getMainTypeLabel() {

        return this.mainTypeLabel;
    }


    public getActiveDocumentViewTab(): string|undefined {

        return this.activeDocumentViewTab;
    }


    public setActiveDocumentViewTab(activeDocumentViewTab: string|undefined) {

        this.activeDocumentViewTab = activeDocumentViewTab;
    }


    public getViewType() {

        if (this.isInOverview()) return 'Project';
        return this.views.getTypeForName(this.currentView);
    }


    public getActiveLayersIds(mainTypeDocumentResourceId: string): string[] {

        return this.resourcesState.getActiveLayersIds(this.currentView, mainTypeDocumentResourceId);
    }


    public setActiveLayersIds(mainTypeDocumentResourceId: string, activeLayersIds: string[]) {

        this.resourcesState.setActiveLayersIds(this.currentView, mainTypeDocumentResourceId,
            activeLayersIds);
    }


    public removeActiveLayersIds(mainTypeDocumentId: string|undefined) {

        if (mainTypeDocumentId)
            this.resourcesState.removeActiveLayersIds(this.currentView, mainTypeDocumentId);
    }


    public getQuery(): Query {

        return this.query;
    }


    public getQueryString() {

        return this.resourcesState.getLastQueryString(this.currentView);
    }


    public setQueryString(q: string) {

        this.query.q = q;
        this.resourcesState.setLastQueryString(this.currentView, q);
    }


    public getQueryTypes() {

        if (!this.query) return undefined;
        return this.query.types;
    }


    // TODO remove redundancy with getQueryTypes
    public getFilterTypes() {

        return this.resourcesState.getLastSelectedTypeFilters(this.currentView);
    }


    public setFilterTypes(filterTypes: any) {

        filterTypes && filterTypes.length > 0 ?
            this.setQueryTypes(filterTypes) :
            this.deleteQueryTypes();

        if (filterTypes && filterTypes.length == 0) delete this.query.types;
        this.resourcesState.setLastSelectedTypeFilters(this.currentView, filterTypes);
    }


    public fetchPathToRootDocumentFromResourcesState(mainTypeDocumentResourceId: string): string|undefined {

        return this.resourcesState.getRootDocumentResourceId(this.currentView, mainTypeDocumentResourceId);
    }


    public setRootDocumentBy(mainTypeDocumentResourceId: string, rootDocumentResourceId: string|undefined) {

        if (!this.query.constraints) this.query.constraints = {};

        if (rootDocumentResourceId) {
            this.resourcesState.setRootDocumentResourceId(this.currentView, mainTypeDocumentResourceId, rootDocumentResourceId);
            this.query.constraints['liesWithin:contain'] = rootDocumentResourceId;
            delete this.query.constraints['liesWithin:exist'];
        } else {
            this.resourcesState.removeRootDocumentResourceId(this.currentView, mainTypeDocumentResourceId);
            this.query.constraints['liesWithin:exist'] = 'UNKNOWN';
            delete this.query.constraints['liesWithin:contain'];
        }
    }


    // TODO this is bad. it replicates the mechanisum of contraintIndexer. see #6709
    public isSelectedDocumentMatchedByQueryString(selectedDocument: Document|undefined): boolean {

        const queryString = this.getQueryString();
        if (!queryString) return true;
        if (!selectedDocument || queryString == '') return true;

        const tokens: Array<string> = queryString.split(' ');
        const resource: Resource = selectedDocument.resource;

        for (let token of tokens) {
            if (resource.identifier && resource.identifier.toLowerCase().startsWith(token.toLowerCase())) continue;
            if (resource.shortDescription && resource.shortDescription.toLowerCase()
                    .startsWith(token.toLowerCase())) continue;

            return false;
        }

        return true;
    }


    public isSelectedDocumentTypeInTypeFilters(selectedDocument: Document|undefined): boolean {

        if (!selectedDocument) return true;
        const queryTypes = this.getQueryTypes();
        if (!queryTypes) return true;

        return (queryTypes.indexOf(selectedDocument.resource.type) != -1);
    }


    public setLastSelectedOperationTypeDocumentId(selectedMainTypeDocumentResourceId: string|undefined) {

        if (!selectedMainTypeDocumentResourceId) return;

        this.resourcesState.setLastSelectedOperationTypeDocumentId(this.currentView,
            selectedMainTypeDocumentResourceId);
    }


    public getLastSelectedOperationTypeDocumentId() {

        return this.resourcesState.getLastSelectedOperationTypeDocumentId(this.currentView);
    }


    public initialize(defaultMode?: any)  {

        return this.resourcesState.initialize().then(() => {

            this.initializeMode(defaultMode);
            this.initializeQuery();

            this.activeDocumentViewTab = undefined;
        });
    }


    public setupView(viewName: string, defaultMode: string): Promise<any> {

        return ((!this.currentView || viewName != this.currentView)
            ? this.initializeView(viewName)

            // TODO simplify this branch
            : Promise.resolve()).then(() => {
                return this.initialize(defaultMode ? 'map' : undefined);
            });
    }


    public setupPathToRootDocument(mainTypeDocument: Document|undefined) {

        if (!mainTypeDocument || !mainTypeDocument.resource.id) return;

        const rootDocumentResourceId: string|undefined
            = this.fetchPathToRootDocumentFromResourcesState(mainTypeDocument.resource.id);
        this.setRootDocumentBy(mainTypeDocument.resource.id, rootDocumentResourceId);
    }


    private async initializeView(viewName: string): Promise<any> {

        this.currentView = viewName;
        this.mainTypeLabel = (viewName == 'project')
            ? 'Projekt' : this.views.getLabelForName(this.currentView);
    }


    private initializeMode(defaultMode?: string) {

        if (defaultMode) {
            return this.setLastSelectedMode(defaultMode);
        }
        if (!this.restoreLastSelectedMode()) {
            this.setLastSelectedMode('map');
        }
    }


    private initializeQuery() {

        this.query = { q: this.getQueryString() };

        const filterTypes = this.getFilterTypes();
        if (filterTypes && filterTypes.length > 0) this.query.types = filterTypes;
    }


    private setQueryTypes(types: any) {

        this.query.types = types;
    }


    private deleteQueryTypes() {

        delete this.query.types;
    }


    private setLastSelectedMode(mode: string) {

        this.mode = mode;
        this.resourcesState.setLastSelectedMode(this.currentView, mode);
    }


    private restoreLastSelectedMode(): boolean {

        const mode = this.resourcesState.getLastSelectedMode(this.currentView);
        if (mode) {
            this.mode = mode;
            return true; // to indicate success
        } else {
            return false;
        }
    }
}
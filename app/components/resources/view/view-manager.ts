import {Resource} from 'idai-components-2/core';
import {Query} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {OperationViews} from './operation-views';
import {ResourcesState} from './resources-state';

/**
 * Holds and provides acces to the current view, which is one of the views from this.views,
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
    private liesWithinPath: string[]|undefined;

    private viewName: string;

    constructor(
        private views: OperationViews,
        private resourcesState: ResourcesState) {
    }


    public isInOverview() {

        return this.viewName == 'project';
    }


    public getViewName() {

        return this.viewName;
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
        return this.views.getTypeForName(this.viewName);
    }


    public getActiveLayersIds(mainTypeDocumentResourceId: string): string[] {

        return this.resourcesState.getActiveLayersIds(this.viewName, mainTypeDocumentResourceId);
    }


    public setActiveLayersIds(mainTypeDocumentResourceId: string, activeLayersIds: string[]) {

        this.resourcesState.setActiveLayersIds(this.viewName, mainTypeDocumentResourceId,
            activeLayersIds);
    }


    public removeActiveLayersIds(mainTypeDocumentId: string|undefined) {

        if (mainTypeDocumentId)
            this.resourcesState.removeActiveLayersIds(this.viewName, mainTypeDocumentId);
    }


    public getQuery(): Query {

        return this.query;
    }


    public getQueryString() {

        return this.resourcesState.getLastQueryString(this.viewName);
    }


    public setQueryString(q: string) {

        this.query.q = q;
        this.resourcesState.setLastQueryString(this.viewName, q);
    }


    public getQueryTypes() {

        if (!this.query) return undefined;
        return this.query.types;
    }


    // TODO remove redundancy with getQueryTypes
    public getFilterTypes() {

        return this.resourcesState.getLastSelectedTypeFilters(this.viewName);
    }


    public setFilterTypes(filterTypes: any) {

        filterTypes && filterTypes.length > 0 ?
            this.setQueryTypes(filterTypes) :
            this.deleteQueryTypes();

        if (filterTypes && filterTypes.length == 0) delete this.query.types;
        this.resourcesState.setLastSelectedTypeFilters(this.viewName, filterTypes);
    }


    public fetchQueryLiesWithinPathFromResourcesState(mainTypeDocumentResourceId: string): string[]|undefined {

        return this.resourcesState.getLiesWithinPath(this.viewName, mainTypeDocumentResourceId);
    }


    public getQueryLiesWithinPath(): string[]|undefined {

        return this.liesWithinPath;
    }


    public setQueryLiesWithinPath(mainTypeDocumentResourceId: string, liesWithinPath: string[]|undefined) {

        this.liesWithinPath = liesWithinPath;

        if (!this.query.constraints) this.query.constraints = {};

        if (liesWithinPath) {
            this.resourcesState.setLiesWithinPath(this.viewName, mainTypeDocumentResourceId, liesWithinPath);
            this.query.constraints['liesWithin:contain'] = liesWithinPath[liesWithinPath.length - 1];
            delete this.query.constraints['liesWithin:exist'];
        } else {
            this.resourcesState.removeLiesWithinPath(this.viewName, mainTypeDocumentResourceId);
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

        this.resourcesState.setLastSelectedOperationTypeDocumentId(this.viewName,
            selectedMainTypeDocumentResourceId);
    }


    public getLastSelectedOperationTypeDocumentId() {

        return this.resourcesState.getLastSelectedOperationTypeDocumentId(this.viewName);
    }


    public initialize(defaultMode?: any)  {

        return this.resourcesState.initialize().then(() => {

            this.initializeMode(defaultMode);
            this.initializeQuery();

            this.activeDocumentViewTab = undefined;
        });
    }


    public setupView(viewName: string, defaultMode: string): Promise<any> {

        return ((!this.viewName || viewName != this.viewName)
            ? this.initializeView(viewName) : Promise.resolve()).then(() => {

            return this.initialize(defaultMode ? 'map' : undefined);
        });
    }


    public setupLiesWithinPath(mainTypeDocument: Document|undefined) {

        if (!mainTypeDocument || !mainTypeDocument.resource.id) return;

        const liesWithinPath: string[]|undefined
            = this.fetchQueryLiesWithinPathFromResourcesState(mainTypeDocument.resource.id);
        this.setQueryLiesWithinPath(mainTypeDocument.resource.id, liesWithinPath);
    }


    private initializeView(viewName: string): Promise<any> {

        return Promise.resolve().then(
            () => {
                this.viewName = viewName;

                if (viewName == 'project') {
                    this.mainTypeLabel = 'Projekt';
                } else {
                    this.mainTypeLabel = this.views.getLabelForName(this.viewName);
                }

            }
        ).catch(() => Promise.reject(null));
    }


    private initializeMode(defaultMode?: string) {

        if (defaultMode) {
            this.mode = defaultMode;
            this.setLastSelectedMode(defaultMode);
        } else if (this.getLastSelectedMode()) {
            this.mode = this.getLastSelectedMode();
        } else {
            this.mode = 'map';
            this.setLastSelectedMode('map');
        }
    }


    private initializeQuery() {

        this.query = { q: this.getQueryString() };

        const filterTypes = this.getFilterTypes();
        if (filterTypes && filterTypes.length > 0) this.query.types = this.getFilterTypes();
    }


    private setQueryTypes(types: any) {

        this.query.types = types;
    }


    private deleteQueryTypes() {

        delete this.query.types;
    }


    private setLastSelectedMode(defaultMode: string) {

        this.resourcesState.setLastSelectedMode(this.viewName, defaultMode);
    }


    private getLastSelectedMode() {

        return this.resourcesState.getLastSelectedMode(this.viewName);
    }
}
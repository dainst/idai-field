import {Resource} from 'idai-components-2/core';
import {ViewDefinition} from 'idai-components-2/configuration';
import {Query} from 'idai-components-2/datastore';
import {Views} from './views';
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

    private mode: string; // 'map' or 'list'
    private query: Query;
    public view: ViewDefinition;
    private mainTypeLabel: string;


    constructor(
        private views: Views,
        private resourcesState: ResourcesState) {
    }


    public isInOverview() {

        return this.getView() && this.getView().mainType == 'Project';
    }


    public getCurrentFilterType()  {

        return (this.getFilterTypes() &&
        this.getFilterTypes().length > 0 ?
            this.getFilterTypes()[0] : undefined);
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


    public getView() {

        return this.view;
    }


    public getActiveLayersIds(mainTypeDocumentResourceId) {

        return this.resourcesState.getActiveLayersIds(this.view.name, mainTypeDocumentResourceId);
    }


    public setActiveLayersIds(mainTypeDocumentResourceId, activeLayersIds) {

        this.resourcesState.setActiveLayersIds(this.view.name, mainTypeDocumentResourceId,
            activeLayersIds);
    }


    public removeActiveLayersIds(mainTypeDocumentId) {

        this.resourcesState.removeActiveLayersIds(this.view.name, mainTypeDocumentId);
    }


    public getQueryString() {

        return this.resourcesState.getLastQueryString(this.view.name);
    }


    public setQueryString(q) {

        this.query.q = q;
        this.resourcesState.setLastQueryString(this.view.name, q);
    }


    public getQueryTypes() {

        if (!this.query) return undefined;
        return this.query.types;
    }


    public getFilterTypes() {

        return this.resourcesState.getLastSelectedTypeFilters(this.view.name);
    }


    // TODO this is bad. it replicates the mechanisum of contraintIndexer. see #6709
    public isSelectedDocumentMatchedByQueryString(selectedDocument): boolean {

        if (!selectedDocument || this.getQueryString() == '') return true;

        const tokens: Array<string> = this.getQueryString().split(' ');
        const resource: Resource = selectedDocument.resource;

        for (let token of tokens) {
            if (resource.identifier && resource.identifier.toLowerCase().startsWith(token.toLowerCase())) continue;
            if (resource.shortDescription && resource.shortDescription.toLowerCase()
                    .startsWith(token.toLowerCase())) continue;

            return false;
        }

        return true;
    }


    public setFilterTypes(filterTypes) {

        filterTypes && filterTypes.length > 0 ?
            this.setQueryTypes(filterTypes) :
            this.deleteQueryTypes();

        if (filterTypes && filterTypes.length == 0) delete this.query.types;
        this.resourcesState.setLastSelectedTypeFilters(this.view.name, filterTypes);
    }


    public isSelectedDocumentTypeInTypeFilters(selectedDocument): boolean {

        if (!selectedDocument) return true;

        return (!this.getQueryTypes() ||
            this.getQueryTypes().indexOf(selectedDocument.resource.type) != -1);
    }


    public setLastSelectedOperationTypeDocumentId(selectedMainTypeDocumentResourceId) {

        this.resourcesState.setLastSelectedOperationTypeDocumentId(this.view.name,
            selectedMainTypeDocumentResourceId);
    }


    public getLastSelectedOperationTypeDocumentId() {

        return this.resourcesState.getLastSelectedOperationTypeDocumentId(this.view.name);
    }


    public initialize(defaultMode?)  {

        return this.resourcesState.initialize().then(() => {

            this.initializeMode(defaultMode);
            this.initializeQuery();
        })
    }


    public setupView(viewName: string, defaultMode: string): Promise<any> {

        return ((!this.view || viewName != this.view.name)
            ? this.initializeView(viewName) : Promise.resolve()).then(() => {

            return this.initialize(defaultMode ? 'map' : undefined);
        });
    }


    private initializeView(viewName: string): Promise<any> {

        return Promise.resolve().then(
            () => {
                this.view = this.views.getView(viewName);
                this.mainTypeLabel = this.views.getLabelForType(this.view);
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

        if (this.getFilterTypes() &&
            this.getFilterTypes().length > 0)
            this.query.types = this.getFilterTypes();
    }


    private setQueryTypes(types) {

        this.query.types = types;
    }


    private deleteQueryTypes() {

        delete this.query.types;
    }


    private setLastSelectedMode(defaultMode) {

        this.resourcesState.setLastSelectedMode(this.view.name, defaultMode);
    }


    private getLastSelectedMode() {

        return this.resourcesState.getLastSelectedMode(this.view.name);
    }
}
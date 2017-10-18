import {Params} from '@angular/router';
import {Resource} from 'idai-components-2/core';
import {ProjectConfiguration, ViewDefinition} from 'idai-components-2/configuration';
import {Query} from 'idai-components-2/datastore';
import {ViewUtility} from '../../common/view-utility';
import {ResourcesState} from './resources-state';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ViewManager {

    private mode: string; // 'map' or 'list'
    private query: Query;
    public view: ViewDefinition;
    private mainTypeLabel: string;


    constructor(private viewUtility: ViewUtility,
                private projectConfiguration: ProjectConfiguration,
                private resourcesState: ResourcesState) {
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

        if (!this.getQueryTypes() || this.getQueryTypes().indexOf(selectedDocument.resource.type) != -1) return true;

        return false;
    }


    public setLastSelectedMainTypeDocumentId(selectedMainTypeDocumentResourceId) {

        this.resourcesState.setLastSelectedMainTypeDocumentId(this.view.name,
            selectedMainTypeDocumentResourceId);
    }


    public getLastSelectedMainTypeDocumentId() {

        return this.resourcesState.getLastSelectedMainTypeDocumentId(this.view.name);
    }


    public initialize(defaultMode?)  {

        return this.resourcesState.initialize().then(() => {

            this.initializeMode(defaultMode);
            this.initializeQuery();
        })
    }


    public setupViewFrom(params: Params): Promise<any> {

        return ((!this.view || params['view'] != this.view.name)
            ? this.initializeView(params['view']) : Promise.resolve()).then(() => {

            let defaultMode = params['id'] ? 'map' : undefined;
            return this.initialize(defaultMode);
        });
    }


    public getViewNameForDocument(document) {

        return this.viewUtility.getViewNameForDocument(document);
    }


    public getMainTypeDocumentLabel(document) {

        return this.viewUtility.getMainTypeDocumentLabel(document);
    }


    public getMainTypeHomeViewNameForMainTypeName(mainTypeName: string): Promise <string> {

        return this.viewUtility.getMainTypeHomeViewNameForMainTypeName(mainTypeName);
    }


    private initializeView(viewName: string): Promise<any> {

        return Promise.resolve().then(
            () => {
                this.view = this.projectConfiguration.getView(viewName);
                this.mainTypeLabel = this.projectConfiguration.getLabelForType(this.view.mainType);
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
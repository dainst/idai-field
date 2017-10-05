import {Params} from '@angular/router';
import {ViewUtility} from "../common/view-utility";
import {Injectable} from "@angular/core";
import {ResourcesState} from './resources-state';
import {ProjectConfiguration, ViewDefinition} from 'idai-components-2/configuration';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ViewManager {

    private mode: string; // 'map' or 'list'

    public view: ViewDefinition;

    private mainTypeLabel: string;

    constructor(private viewUtility: ViewUtility,
                private projectConfiguration: ProjectConfiguration,
                private resourcesState: ResourcesState) {

    }

    public setMode(mode, store = true) {

        this.mode = mode;
        if (store) this.setLastSelectedMode(mode);
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

    public getLastQueryString() {

        return this.resourcesState.getLastQueryString(this.view.name);
    }

    public setLastQueryString(q) {

        this.resourcesState.setLastQueryString(this.view.name, q);
    }

    public getLastSelectedTypeFilters() {

        return this.resourcesState.getLastSelectedTypeFilters(this.view.name);
    }

    public setLastSelectedTypeFilters(filterTypes) {

        this.resourcesState.setLastSelectedTypeFilters(this.view.name, filterTypes);
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

        return this.viewUtility.getViewNameForDocument(document)
    }

    public getMainTypeDocumentLabel(document) {

        return this.viewUtility.getMainTypeDocumentLabel(document);
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

    private setLastSelectedMode(defaultMode) {

        this.resourcesState.setLastSelectedMode(this.view.name, defaultMode);
    }

    private getLastSelectedMode() {

        return this.resourcesState.getLastSelectedMode(this.view.name);
    }
}
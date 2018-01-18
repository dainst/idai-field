import {Injectable} from '@angular/core';
import {ResourcesViewState} from './resources-view-state';
import {StateSerializer} from '../../../common/state-serializer';
import {NavigationPath} from '../navigation-path';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ResourcesState {

    private _: { [viewName: string]: ResourcesViewState };


    constructor(private serializer: StateSerializer) {}


    public resetForE2E() {

        this._ = { };
    }


    public initialize(): Promise<any> {

        if (this._) return Promise.resolve();

        return this.serializer.load(StateSerializer.RESOURCES_STATE)
            .then(resourcesStateMap => this._ = resourcesStateMap);
    }


    public setSelectedOperationTypeDocumentId(viewName: string, id: string) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].mainTypeDocumentId = id;
        this.serialize();
    }


    public getSelectedOperationTypeDocumentId(viewName: string): string|undefined {

        return (!this._[viewName]) ? undefined : this._[viewName].mainTypeDocumentId;
    }


    public setSelectedMode(viewName: string, mode: string) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].mode = mode;
        this.serialize();
    }


    public getSelectedMode(viewName: string): string|undefined {

        return (!this._[viewName]) ? undefined : this._[viewName].mode;
    }


    public setQueryString(viewName: string, q: string) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].q = q;
        this.serialize();
    }


    public getQueryString(viewName: string) {

        if (!this._) return '';
        return (!this._[viewName] || !this._[viewName].q) ? '' : this._[viewName].q;
    }


    public setSelectedTypeFilters(viewName: string, types: string[]) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].types = types;
        this.serialize();
    }


    public getSelectedTypeFilters(viewName: string): string[]|undefined {

        if (!this._) return undefined;
        return (!this._[viewName]) ? undefined : this._[viewName].types;
    }


    public setActiveLayersIds(viewName: string, mainTypeDocumentResourceId: string, activeLayersIds: string[]) {

        if (!this._[viewName]) this._[viewName] = {};
        if (!this._[viewName].layerIds) this._[viewName].layerIds = {};

        const layerIds = this._[viewName].layerIds;
        if (!layerIds) return;

        layerIds[mainTypeDocumentResourceId] = activeLayersIds.slice(0);
        this.serialize();
    }


    public getActiveLayersIds(viewName: string, mainTypeDocumentResourceId: string): string[] {

        if (!this._[viewName] || !this._[viewName].layerIds) return [];

        const layerIds = this._[viewName].layerIds;
        if (!layerIds) return [];

        return layerIds[mainTypeDocumentResourceId];
    }


    public removeActiveLayersIds(viewName: string, mainTypeDocumentResourceId: string) {

        if (!this._[viewName] || !this._[viewName].layerIds) return;

        const layerIds = this._[viewName].layerIds;
        if (!layerIds) return;

        delete layerIds[mainTypeDocumentResourceId];
        this.serialize();
    }


    public setNavigationPath(viewName: string, mainTypeDocumentResourceId: string, navigationPath: NavigationPath) {

        if (!this._[viewName]) this._[viewName] = {};
        if (!this._[viewName].navigationPaths) this._[viewName].navigationPaths = {};

        const navigationPaths = this._[viewName].navigationPaths;
        if (!navigationPaths) return;

        navigationPaths[mainTypeDocumentResourceId] = navigationPath;
    }


    public getNavigationPath(viewName: string, mainTypeDocumentResourceId: string): NavigationPath|undefined {

        if (!this._[viewName] || !this._[viewName].navigationPaths) return undefined;

        const navigationPaths = this._[viewName].navigationPaths;
        if (!navigationPaths) return undefined;

        return navigationPaths[mainTypeDocumentResourceId];
    }


    public removeNavigationPath(viewName: string, mainTypeDocumentResourceId: string) {

        if (!this._[viewName] || !this._[viewName].navigationPaths) return;

        const navigationPaths = this._[viewName].navigationPaths;
        if (!navigationPaths) return;

        delete navigationPaths[mainTypeDocumentResourceId];
    }


    private serialize() {

        this.serializer.store(StateSerializer.RESOURCES_STATE, this.createObjectToSerialize());
    }


    private createObjectToSerialize() : { [viewName: string]: ResourcesViewState } {

        const objectToSerialize: { [viewName: string]: ResourcesViewState } = {};

        for (let viewName of Object.keys(this._)) {
            objectToSerialize[viewName] = {};
            if (this._[viewName].mainTypeDocumentId) {
                objectToSerialize[viewName].mainTypeDocumentId = this._[viewName].mainTypeDocumentId;
            }
            if (this._[viewName].mode) objectToSerialize[viewName].mode = this._[viewName].mode;
            if (this._[viewName].layerIds) objectToSerialize[viewName].layerIds = this._[viewName].layerIds;
        }

        return objectToSerialize;
    }
}
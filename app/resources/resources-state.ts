import {Injectable} from '@angular/core';
import {ResourcesViewState} from './resources-view-state';
import {ResourcesStateSerializer} from './resources-state-serializer';

@Injectable()

/**
 * @author Thomas Kleinke
 */
export class ResourcesState {

    private _: { [viewName: string]: ResourcesViewState };

    constructor(private serializer: ResourcesStateSerializer) {}

    public initialize(): Promise<any> {

        if (this._) return Promise.resolve();

        return this.serializer.load().then(resourcesStateMap => this._ = resourcesStateMap);
    }

    public setLastSelectedMainTypeDocumentId(viewName: string, id: string) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].mainTypeDocumentId = id;
        this.serializer.store(this._);
    }

    public getLastSelectedMainTypeDocumentId(viewName: string): string {

        return (!this._[viewName]) ? undefined : this._[viewName].mainTypeDocumentId;
    }

    public setLastSelectedMode(viewName: string, mode: string) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].mode = mode;
        this.serializer.store(this._);
    }

    public getLastSelectedMode(viewName: string) {

        return (!this._[viewName]) ? undefined : this._[viewName].mode;
    }

    public setLastSelectedTypeFilter(viewName: string, type: string) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].type = type;
        this.serializer.store(this._);
    }

    public getLastSelectedTypeFilter(viewName: string): string {

         return (!this._[viewName]) ? undefined : this._[viewName].type;
    }

    public setActiveLayersIds(viewName: string, mainTypeDocumentId: string, activeLayersIds: string[]) {

        if (!this._[viewName]) this._[viewName] = {};
        if (!this._[viewName].layerIds) this._[viewName].layerIds = {};
        this._[viewName].layerIds[mainTypeDocumentId] = activeLayersIds;
        this.serializer.store(this._);
    }

    public getActiveLayersIds(viewName: string, mainTypeDocumentId: string): string[] {

        return (!this._[viewName] || !this._[viewName].layerIds )
            ? undefined : this._[viewName].layerIds[mainTypeDocumentId];
    }

    public removeActiveLayersIds(viewName: string, mainTypeDocumentId: string) {

        if (!this._[viewName] || !this._[viewName].layerIds) return;

        delete this._[viewName].layerIds[mainTypeDocumentId];
        this.serializer.store(this._);
    }

    public clear() {
        this._ = {};
    }
}
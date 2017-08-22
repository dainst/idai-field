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

    public clear() {
        this._ = {};
    }
}
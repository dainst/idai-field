import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';

interface ResourcesViewState {
    mainTypeDocument?: IdaiFieldDocument;
    type?: string;
    mode?: string;
}

@Injectable()

/**
 * @author Thomas Kleinke
 */
export class ResourcesState {

    private _: { [viewName: string]: ResourcesViewState } = {};

    public setLastSelectedMainTypeDocument(viewName: string, mainTypeDocument: IdaiFieldDocument) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].mainTypeDocument = mainTypeDocument;
    }

    public getLastSelectedMainTypeDocument(viewName: string): IdaiFieldDocument {

        return (!this._[viewName]) ? undefined : this._[viewName].mainTypeDocument;
    }

    public setLastSelectedMode(viewName: string, mode: string) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].mode = mode;
    }

    public getLastSelectedMode(viewName: string) {

        return (!this._[viewName]) ? undefined : this._[viewName].mode;
    }


    public setLastSelectedTypeFilter(viewName: string, type: string) {

        if (!this._[viewName]) this._[viewName] = {};
        this._[viewName].type = type;
    }

    public getLastSelectedTypeFilter(viewName: string): string {

         return (!this._[viewName]) ? undefined : this._[viewName].type;
    }

    public clear() {
        this._ = {};
    }
}
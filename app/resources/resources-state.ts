import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ResourcesViewState} from './resources-view-state';

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
        if (!this._[viewName]) {
            return undefined;
        } else {
            return this._[viewName].mainTypeDocument;
        }
    }

    public clear() {
        this._ = {};
    }
}
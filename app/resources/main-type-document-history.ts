import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';

@Injectable()

/**
 * @author Thomas Kleinke
 */
export class MainTypeDocumentHistory {

    private _: { [viewName: string]: IdaiFieldDocument } = {};

    public updateEntry(viewName: string, mainTypeDocument: IdaiFieldDocument) {

        this._[viewName] = mainTypeDocument;
    }

    public getLastSelectedMainTypeDocumentFor(viewName: string): IdaiFieldDocument {

        return this._[viewName];
    }

    public clear() {

        this._ = {};
    }
}
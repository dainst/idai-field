import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';

@Injectable()

/**
 * @author Thomas Kleinke
 */
export class ResourcesState {

    private mainTypeDocumentHistory: { [viewName: string]: IdaiFieldDocument } = {};

    public setLastSelectedMainTypeDocument(viewName: string, mainTypeDocument: IdaiFieldDocument) {
        this.mainTypeDocumentHistory[viewName] = mainTypeDocument;
    }

    public getLastSelectedMainTypeDocument(viewName: string): IdaiFieldDocument {
        return this.mainTypeDocumentHistory[viewName];
    }

    public clear() {
        this.mainTypeDocumentHistory = {};
    }
}
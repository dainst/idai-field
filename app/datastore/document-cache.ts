import {Injectable} from "@angular/core";
import {Document} from 'idai-components-2/core';

@Injectable()
/**
 * @author Daniel M. de Oliveira
 */
export class DocumentCache {

    private _: { [resourceId: string]: Document } = { };

    public set(doc: Document) {
        return this._[doc.resource.id] = doc;
    }

    public get(resourceId: string) {
        return this._[resourceId];
    }

    public remove(resourceId) {
        delete this._[resourceId];
    }

    public clear() {
        this._ = { };
    }
}
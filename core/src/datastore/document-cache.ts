import {Document} from '../model/document';


/**
 * @author Daniel de Oliveira
 */
export class DocumentCache {

    protected _: { [resourceId: string]: Document } = {};


    public set(document: Document): Document {

        return this._[document.resource.id as any] = document;
    }


    public get(resourceId: string): Document {

        return this._[resourceId];
    }


    public remove(resourceId: any) {

        delete this._[resourceId];
    }


    public reassign(document: Document) {

        if (!document._conflicts) {
            delete (this.get(document.resource.id) as any)._conflicts;
        }
        Object.assign(this.get(document.resource.id), document);

        return document;
    }


    public resetForE2E() {

        this._ = {};
    }
}

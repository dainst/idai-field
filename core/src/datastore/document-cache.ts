import { Document } from '../model/document';


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


    public getAll(): Array<Document> {

        return Object.values(this._);
    }


    public remove(resourceId: any) {

        delete this._[resourceId];
    }


    public reassign(document: Document) {

        if (!document._conflicts) delete (this.get(document.resource.id))._conflicts;
        if (!document.warnings) delete (this.get(document.resource.id)).warnings;

        Object.assign(this.get(document.resource.id), document);

        return document;
    }


    public reset() {

        this._ = {};
    }
}

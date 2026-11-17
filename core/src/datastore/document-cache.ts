import { Document } from '../model/document/document';


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

        const cachedDocument: Document = this.get(document.resource.id);

        if (!document._conflicts) delete cachedDocument._conflicts;
        if (!document.warnings) delete cachedDocument.warnings;

        Object.assign(cachedDocument, document);

        return cachedDocument;
    }


    public reset() {

        this._ = {};
    }
}

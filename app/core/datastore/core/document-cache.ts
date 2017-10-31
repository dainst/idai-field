import {Injectable} from "@angular/core";
import {Document} from 'idai-components-2/core';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class DocumentCache<T extends Document> {


    constructor() {

        console.debug("constructing document cache");
    }

    protected _: { [resourceId: string]: T } = { };


    public set(doc: T) {

        return this._[doc.resource.id as any] = doc;
    }


    public get(resourceId: string): T {

        return this._[resourceId];
    }


    public remove(resourceId: any) {

        delete this._[resourceId];
    }


    public resetForE2E() {

        this._ = { };
    }
}
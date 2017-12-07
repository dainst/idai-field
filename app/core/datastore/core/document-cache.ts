import {Injectable} from "@angular/core";
import {Document} from 'idai-components-2/core';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class DocumentCache<T extends Document> {

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


    public reassign(doc: T) {

        if (!(doc as any)['_conflicts'])
            delete (this.get(doc.resource.id as any)as any)['_conflicts'];
        Object.assign(this.get(doc.resource.id as any), doc);
    }


    public resetForE2E() {

        this._ = { };
    }
}
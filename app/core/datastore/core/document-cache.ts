import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class DocumentCache<T extends Document> {

    protected _: { [resourceId: string]: T } = {};


    public set(document: T): T {

        return this._[document.resource.id as any] = document;
    }


    public get(resourceId: string): T {

        return this._[resourceId];
    }


    public remove(resourceId: any) {

        delete this._[resourceId];
    }


    public reassign(document: T) {

        if (!(document as any)['_conflicts']) {
            delete (this.get(document.resource.id) as any)['_conflicts'];
        }
        Object.assign(this.get(document.resource.id), document);

        return document;
    }


    public resetForE2E() {

        this._ = {};
    }
}
import {Injectable} from "@angular/core";
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class DocumentCache {


    private _: { [resourceId: string]: IdaiFieldDocument } = { };


    public set(doc: IdaiFieldDocument) {

        return this._[doc.resource.id as any] = doc;
    }


    public get(resourceId: string): IdaiFieldDocument {

        return this._[resourceId];
    }


    public remove(resourceId: any) {

        delete this._[resourceId];
    }


    public clear() {

        this._ = { };
    }
}
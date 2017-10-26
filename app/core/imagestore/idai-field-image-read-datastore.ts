import {DocumentChange, Query, ReadDatastore} from 'idai-components-2/datastore';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {Injectable} from '@angular/core';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class IdaiFieldImageReadDatastore extends ReadDatastore {


    constructor(private datastore: ReadDatastore) {

        super();
    }


    public async get(resourceId: string, options?: Object): Promise<IdaiFieldImageDocument> {

        const document = await this.datastore.get(resourceId, options);

        // TODO make sure all declared fields are present

        return document as IdaiFieldImageDocument;
    }


    public async find(query: Query): Promise<IdaiFieldImageDocument[]> {

        const documents = await this.datastore.find(query);

        // TODO make sure all declared fields are present

        return documents as IdaiFieldImageDocument[];
    }


    public documentChangesNotifications(): Observable<DocumentChange> {

        return this.datastore.documentChangesNotifications();
    }
}
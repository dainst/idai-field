import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2/datastore';

@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ImagesState {

    private query: Query;


    public getQuery(): Query {

        return this.query;
    }

    public setQuery(query: Query) {

        this.query = query;
    }
}
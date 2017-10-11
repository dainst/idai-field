import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2/datastore';

@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ImagesState {

    private query: Query;
    private gridSize: number = 4;


    public getQuery(): Query {

        return this.query;
    }

    public setQuery(query: Query) {

        this.query = query;
    }

    public getGridSize(): number {
        return this.gridSize;
    }

    public setGridSize(value: number) {
        this.gridSize = value;
    }
}
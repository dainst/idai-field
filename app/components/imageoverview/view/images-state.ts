import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2';

@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ImagesState {

    private query: Query;
    private mainTypeDocumentFilterOption: string = '';
    private gridSize: number = 4;

    private initialized: boolean = false;


    constructor() {}


    public resetForE2E() {

        this.initialized = true;
    }


    public async initialize(): Promise<any> {

        if (this.initialized) return;
        this.initialized = true;
    }


    public getQuery(): Query {

        return this.query;
    }


    public setQuery(query: Query) {

        this.query = query;
    }


    public getMainTypeDocumentFilterOption(): string {

        if (!this.mainTypeDocumentFilterOption) return 'ALL';

        const result = this.mainTypeDocumentFilterOption;
        if (['LINKED','UNLINKED'].indexOf(this.mainTypeDocumentFilterOption) !== -1) {
            return result;
        }
        return 'ALL';
    }


    public setMainTypeDocumentFilterOption(mainTypeDocumentFilterOption: string) {

        this.mainTypeDocumentFilterOption = mainTypeDocumentFilterOption;
    }


    public getGridSize(): number {

        return this.gridSize;
    }


    public setGridSize(value: number) {

        this.gridSize = value;
    }
}
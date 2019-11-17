import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2';

@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MediaState {

    private query: Query;
    private customConstraints: { [name: string]: string } = {};
    private gridSize: number = 4;
    private expandAllGroups: boolean = false;


    constructor() {}


    public getQuery(): Query {

        return this.query;
    }


    public setQuery(query: Query) {

        this.query = query;
    }


    public getCustomConstraints(): { [name: string]: string } {

        return this.customConstraints;
    }


    public setCustomConstraints(customConstraints: { [name: string]: string }) {

        this.customConstraints = customConstraints;
    }


    public getNrMediaResourcesPerRow(): number {

        return this.gridSize;
    }


    public setNrMediaResourcesPerRow(value: number) {

        this.gridSize = value;
    }


    public getExpandAllGroups(): boolean {

        return this.expandAllGroups;
    }


    public setExpandAllGroups(expandAllGroups: boolean) {

        this.expandAllGroups = expandAllGroups;
    }
}
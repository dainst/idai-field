import {Injectable} from '@angular/core';
import {Query} from 'idai-components-2';


export type ImageFilterOption = 'ALL'|'LINKED'|'UNLINKED';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ImagesState {

    private query: Query;
    private customConstraints: { [name: string]: string } = {};
    private linkFilter: ImageFilterOption = 'ALL';
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


    public getLinkFilter(): ImageFilterOption {

        if (!this.linkFilter) return 'ALL';

        const result = this.linkFilter;
        if (['LINKED','UNLINKED'].indexOf(this.linkFilter) !== -1) {
            return result;
        }
        return 'ALL';
    }


    public setLinkFilter(linkFilter: ImageFilterOption) {

        this.linkFilter = linkFilter;
    }


    public getNrImagesPerRow(): number {

        return this.gridSize;
    }


    public setNrImagesPerRow(value: number) {

        this.gridSize = value;
    }


    public getExpandAllGroups(): boolean {

        return this.expandAllGroups;
    }


    public setExpandAllGroups(expandAllGroups: boolean) {

        this.expandAllGroups = expandAllGroups;
    }
}
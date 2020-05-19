import {Injectable} from '@angular/core';
import {Query} from '../../../datastore/model/query';
import {ProjectCategories} from '../../../configuration/project-categories';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ImagesState {

    private query: Query;
    private customConstraints: { [name: string]: string } = {};
    private gridSize: number = 4;
    private expandAllGroups: boolean = false;


    constructor(private projectCategories: ProjectCategories) {}


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


    public resetForE2E() {

        if (this.query) {
            this.query.q = '';
            this.query.categories = this.projectCategories.getImageCategoryNames();
        }

        this.customConstraints = {};
        this.gridSize = 4;
        this.expandAllGroups = false;
    }
}

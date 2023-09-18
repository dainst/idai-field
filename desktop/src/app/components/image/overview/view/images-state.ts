import { Injectable } from '@angular/core';
import { Named, Query, ProjectConfiguration } from 'idai-field-core';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class ImagesState {

    private query: Query;
    private customConstraints: { [name: string]: string } = {};
    private gridSize: number = 4;
    private expandAllGroups: boolean = false;
    private parseFileMetadata: boolean = false;


    constructor(private projectConfiguration: ProjectConfiguration) {}


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

    public getParseFileMetadata(): boolean {

        return this.parseFileMetadata;
    }

    public setParseFileMetadata(val: boolean) {

        this.parseFileMetadata = val;
    }


    public resetForE2E() {

        if (this.query) {
            this.query.q = '';
            this.query.categories = this.projectConfiguration.getImageCategories().map(Named.toName);
        }

        this.customConstraints = {};
        this.gridSize = 4;
        this.expandAllGroups = false;
    }
}

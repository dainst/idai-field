import { Injectable } from '@angular/core';
import { Named, Query, ProjectConfiguration } from 'idai-field-core';


@Injectable()
/**
 * @author Thomas Kleinke
 * 
 * Can be injected to save/load image ui related user preferences for the application.
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


    /**
     * Does the user prefer to parse image metadata from each individual file? Otherwise, metadata is set using the application
     * interface.
     * 
     * @returns `true` if preference is set to parsing the data from exif, iptc and xmp.
     */
    public getParseFileMetadata(): boolean {

        return this.parseFileMetadata;
    }


    /**
     * Set user preference for image metadata source.
     */
    public setParseFileMetadata(value: boolean) {

        this.parseFileMetadata = value;
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

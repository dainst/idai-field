import { Component, Input, OnChanges } from '@angular/core';
import { Datastore, I18N, ImageDocument, Labels } from 'idai-field-core';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';


type LinkedResourceInfo = { id: string, identifier: string };


@Component({
    selector: 'image-grid-cell',
    templateUrl: './image-grid-cell.html',
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageGridCellComponent implements OnChanges {

    @Input() cell: any;
    @Input() main: ImageDocument;
    @Input() showLinkBadges: boolean = true;
    @Input() showIdentifier: boolean = true;
    @Input() showShortDescription: boolean = true;
    @Input() showGeoIcon: boolean = false;
    @Input() resourceIdentifiers: { [id: string]: string } = {};
    @Input() nrOfColumns: number = 0;

    public linkedResources: Array<LinkedResourceInfo> = [];


    constructor(private labels: Labels,
                private datastore: Datastore) {}


    ngOnChanges() {

        this.initializeLinkedResources();
    }


    public getIdentifier(id: string): string|undefined {

        if (!this.resourceIdentifiers || !Object.keys(this.resourceIdentifiers).length) {
            return undefined;
        }

        return this.resourceIdentifiers[id];
    }


    public getLabelFromI18NString(i18nString: I18N.String|string): string {

        return this.labels.getFromI18NString(i18nString);
    }


    public isEmpty(): boolean {

        return this.cell.imgSrc === ImageUrlMaker.blackImg;
    }


    private async initializeLinkedResources() {

        const targetIds: string[] = this.cell['document'].resource.relations.depicts ?? [];
        const result: Array<LinkedResourceInfo> = [];

        for (let id of targetIds) {
            const identifier: string = await this.fetchIdentifier(id);
            result.push({ id, identifier });
        }

        this.linkedResources = result.filter(linkedResourceInfo => linkedResourceInfo.identifier !== undefined);
    }


    private async fetchIdentifier(id: string): Promise<string|undefined> {

        try {
            const target = await this.datastore.get(id);
            return target.resource.identifier;
        } catch (err) {
            console.warn('Missing relation target: ' + id, err);
            return undefined;
        }
    }
}

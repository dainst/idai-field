import { Component, Input } from '@angular/core';
import { I18N, ImageDocument, Labels } from 'idai-field-core';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';


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
export class ImageGridCellComponent {

    @Input() cell: any;
    @Input() main: ImageDocument;
    @Input() showLinkBadges: boolean = true;
    @Input() showIdentifier: boolean = true;
    @Input() showShortDescription: boolean = true;
    @Input() showGeoIcon: boolean = false;
    @Input() resourceIdentifiers: { [id: string]: string } = {};
    @Input() nrOfColumns: number = 0;


    constructor(private labels: Labels) {}


    public getIdentifier(id: string): string|undefined {

        if (!this.resourceIdentifiers ||
            (Object.keys(this.resourceIdentifiers).length < 1)) {
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
}

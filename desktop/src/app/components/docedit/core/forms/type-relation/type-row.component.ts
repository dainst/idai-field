import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { FieldDocument, ImageVariant } from 'idai-field-core';
import { ModelUtil } from '../../../../../model/model-util';
import { ImageRowItem } from '../../../../image/row/image-row';
import { ImageUrlMaker } from '../../../../../services/imagestore/image-url-maker';


@Component({
    selector: 'type-row',
    templateUrl: './type-row.html',
    standalone: false
})
/**
 * @author Daniel de Oliveira
 */
export class TypeRowComponent implements OnChanges {

    public mainThumbnailUrl: SafeResourceUrl|undefined;

    @Input() document: FieldDocument;
    @Input() images: Array<ImageRowItem>;
    @Output() onSelect: EventEmitter<void> = new EventEmitter<void>();


    constructor(private imageUrlMaker: ImageUrlMaker) {}


    async ngOnChanges() {

        if (this.document) this.mainThumbnailUrl = await this.getMainThumbnailUrl(this.document);
    }


    private async getMainThumbnailUrl(document: FieldDocument): Promise<SafeResourceUrl|undefined> {

        const mainImageId: string | undefined = ModelUtil.getMainImageId(document.resource);
        if (!mainImageId) return undefined;

        return await this.imageUrlMaker.getUrl(mainImageId, ImageVariant.THUMBNAIL);
    }
}

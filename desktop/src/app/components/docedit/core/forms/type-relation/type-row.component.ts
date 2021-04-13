import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {FieldDocument} from 'idai-field-core';
import {ModelUtil} from '../../../../../core/model/model-util';
import {ImageRowItem} from '../../../../../core/images/row/image-row';
import {Imagestore} from '../../../../../core/images/imagestore/imagestore';


@Component({
    selector: 'dai-type-row',
    templateUrl: './type-row.html'
})
/**
 * @author Daniel de Oliveira
 */
export class TypeRowComponent implements OnChanges {

    public mainThumbnailUrl: SafeResourceUrl|undefined;

    @Input() document: FieldDocument;
    @Input() images: Array<ImageRowItem>;
    @Output() onSelect: EventEmitter<void> = new EventEmitter<void>();


    constructor(private imagestore: Imagestore) {}


    async ngOnChanges() {

        if (this.document) this.mainThumbnailUrl = await this.getMainThumbnailUrl(this.document);
    }


    private async getMainThumbnailUrl(document: FieldDocument): Promise<SafeResourceUrl|undefined> {

        const mainImageId: string | undefined = ModelUtil.getMainImageId(document.resource);
        if (!mainImageId) return undefined;

        return await this.imagestore.read(mainImageId, false, true);
    }
}

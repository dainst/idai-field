import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {FieldDocument} from 'idai-components-2';
import {ModelUtil} from '../../../../../core/model/model-util';
import {ReadImagestore} from '../../../../../core/images/imagestore/read-imagestore';
import {ImageRowItem} from '../../../../../core/images/row/image-row';


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


    constructor(private imagestore: ReadImagestore) {}


    async ngOnChanges() {

        if (this.document) this.mainThumbnailUrl = await this.getMainThumbnailUrl(this.document);
    }


    private async getMainThumbnailUrl(document: FieldDocument): Promise<SafeResourceUrl|undefined> {

        const mainImageId: string | undefined = ModelUtil.getMainImageId(document.resource);
        if (!mainImageId) return undefined;

        return await this.imagestore.read(mainImageId, false, true);
    }
}

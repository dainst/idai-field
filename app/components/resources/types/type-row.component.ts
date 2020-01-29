import {Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {FieldDocument, ImageDocument} from 'idai-components-2';
import {ReadImagestore} from '../../../core/images/imagestore/read-imagestore';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {TypeImagesUtil} from '../../../core/util/type-images-util';
import {ModelUtil} from '../../../core/model/model-util';


@Component({
    selector: 'type-row',
    moduleId: module.id,
    templateUrl: './type-row.html',
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class TypeRowComponent implements OnChanges {

    @ViewChild('typeRow', { static: false }) typeRowElement: ElementRef;

    @Input() document: FieldDocument;

    public mainThumbnailUrl: string|undefined;
    public linkedImagesIds: string[];


    constructor(private imagestore: ReadImagestore,
                private fieldDatastore: FieldReadDatastore) {}


    async ngOnChanges() {

        this.mainThumbnailUrl = await this.getMainThumbnailUrl(this.document);

        await this.updateLinkedImages(this.document);
    }


    private async updateLinkedImages(document: FieldDocument) {

        this.linkedImagesIds = await TypeImagesUtil.getIdsOfLinkedImages(document, this.fieldDatastore);
    }


    private async getMainThumbnailUrl(document: FieldDocument): Promise<string|undefined> {

        const mainImageId: string | undefined = ModelUtil.getMainImageId(document);
        if (!mainImageId) return undefined;

        return await this.imagestore.read(mainImageId, false, true);
    }
}
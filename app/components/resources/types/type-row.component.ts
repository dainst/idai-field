import {Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {asyncMap} from 'tsfun-extra';
import {FieldDocument, ImageDocument, Document} from 'idai-components-2';
import {ReadImagestore} from '../../../core/images/imagestore/read-imagestore';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';


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

    private linkedImages: Array<ImageDocument>;


    constructor(private imagestore: ReadImagestore,
                private fieldDatastore: FieldReadDatastore,
                private imageDatastore: ImageReadDatastore) {}


    async ngOnChanges() {

        this.mainThumbnailUrl = await this.getMainThumbnailUrl(this.document);

        await this.updateLinkedImages(this.document);
    }


    private async getMainThumbnailUrl(document: FieldDocument): Promise<string|undefined> {

        const mainImageId: string|undefined = TypeRowComponent.getMainImageId(document);
        if (!mainImageId) return undefined;

        return await this.imagestore.read(
            mainImageId,
            false,
            true
        );
    }


    private async updateLinkedImages(document: FieldDocument) {

        const imageIds = document.resource.type === 'TypeCatalog'
            ? await this.getLinkedImageIdsForTypeCatalog(document)
            : await this.getLinkedImageIdsForType(document);

        this.linkedImages = await this.imageDatastore.getMultiple(imageIds)
    }


    private async getLinkedImageIdsForTypeCatalog(document: FieldDocument): Promise<string[]> {

        const documents: Array<FieldDocument> = (await this.fieldDatastore.find(
            { constraints: { 'liesWithin:contain': document.resource.id } }
        )).documents;

        return (await asyncMap(
            (document: FieldDocument) => this.getTypeImageId(document)
        )(documents)).filter(id => id !== undefined) as string[];
    }


    private async getLinkedImageIdsForType(document: FieldDocument): Promise<string[]> {

        const documents: Array<FieldDocument> = (await this.fieldDatastore.find(
            { constraints: { 'isInstanceOf:contain': document.resource.id } }
        )).documents;

        return documents.map((document: FieldDocument) => TypeRowComponent.getMainImageId(document))
            .filter(id => id !== undefined) as string[];
    }


    private async getTypeImageId(document: FieldDocument): Promise<string|undefined> {

        let imageId: string|undefined = await TypeRowComponent.getMainImageId(document);

        if (!imageId) {
            const linkedImageIds: string[] = await this.getLinkedImageIdsForType(document);
            if (linkedImageIds.length > 0) imageId = linkedImageIds[0];
        }

        return imageId;
    }


    private static getMainImageId(document: FieldDocument): string|undefined {

        if (!Document.hasRelations(document, 'isDepictedIn')) return undefined;

        return document.resource.relations['isDepictedIn'][0];
    }
}
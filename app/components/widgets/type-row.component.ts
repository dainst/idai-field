import {Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {asyncMap} from 'tsfun-extra';
import {FieldDocument, Document} from 'idai-components-2';
import {FieldReadDatastore} from '../../core/datastore/field/field-read-datastore';
import {ImageReadDatastore} from '../../core/datastore/field/image-read-datastore';
import {ReadImagestore} from '../../core/images/imagestore/read-imagestore';
import {ImageRow, ImageRowUpdate} from '../../core/images/row/image-row';


const MAX_IMAGE_WIDTH: number = 600;


@Component({
    selector: 'type-row',
    moduleId: module.id,
    templateUrl: './type-row.html',
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class TypeRowComponent implements OnChanges {

    @ViewChild('typeRow', { static: false }) typeRowElement: ElementRef;
    @ViewChild('imageRow', { static: false }) imageRowElement: ElementRef;

    @Input() document: FieldDocument;

    public mainThumbnailUrl: string|undefined;
    public linkedThumbnailUrls: string[] = [];

    private imageRow: ImageRow;


    constructor(private imagestore: ReadImagestore,
                private fieldDatastore: FieldReadDatastore,
                private imageDatastore: ImageReadDatastore) {}


    async ngOnChanges() {

        this.mainThumbnailUrl = await this.getMainThumbnailUrl(this.document);

        await this.updateLinkedThumbnails(this.document);
    }


    public async nextPage() {

        const result: ImageRowUpdate = this.imageRow.nextPage();
        if (result.positionLeft === 0) return;

        this.linkedThumbnailUrls = this.linkedThumbnailUrls.concat(
            await this.getThumbnailUrls(result.newImageIds)
        );

        this.imageRowElement.nativeElement.style.left = result.positionLeft + 'px';
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


    private async updateLinkedThumbnails(document: FieldDocument) {

        const imageIds: string[] = document.resource.type === 'TypeCatalog'
            ? await this.getLinkedImageIdsForTypeCatalog(document)
            : await this.getLinkedImageIdsForType(document);

        this.imageRow = new ImageRow(
            this.typeRowElement.nativeElement.offsetWidth - 304,
            this.typeRowElement.nativeElement.offsetHeight,
            MAX_IMAGE_WIDTH,
            await this.imageDatastore.getMultiple(imageIds)
        );

        const result: ImageRowUpdate = this.imageRow.nextPage();

        this.linkedThumbnailUrls = this.linkedThumbnailUrls.concat(
            await this.getThumbnailUrls(result.newImageIds)
        );
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


    private async getThumbnailUrls(imageIds: string[]): Promise<string[]> {

        return asyncMap((imageId: string) => {
            return this.imagestore.read(imageId, false, true);
        })(imageIds);
    }


    private static getMainImageId(document: FieldDocument): string|undefined {

        if (!Document.hasRelations(document, 'isDepictedIn')) return undefined;

        return document.resource.relations['isDepictedIn'][0];
    }
}
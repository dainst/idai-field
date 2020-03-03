import {Component, Input, OnChanges} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {take} from 'tsfun';
import {map as asyncMap, reduce as asyncReduce} from 'tsfun/async';
import {FieldDocument, ImageDocument} from 'idai-components-2';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {Loading} from '../../widgets/loading';
import {BaseList} from '../base-list';
import {ResourcesComponent} from '../resources.component';
import {TypeImagesUtil} from '../../../core/util/type-images-util';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {ImageRowItem, PLACEHOLDER} from '../../image/row/image-row.component';
import {ReadImagestore} from '../../../core/images/imagestore/read-imagestore';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {ImageWidthCalculator} from '../../../core/images/row/image-width-calculator';


@Component({
    selector: 'type-grid',
    moduleId: module.id,
    templateUrl: './type-grid.html'
})
/**
 * @author Thomas Kleinke
 */
export class TypeGridComponent extends BaseList implements OnChanges {

    @Input() documents: Array<FieldDocument>;

    public images: { [resourceId: string]: Array<SafeResourceUrl> } = {};


    constructor(private fieldDatastore: FieldReadDatastore,
                private imageDatastore: ImageReadDatastore,
                private imagestore: ReadImagestore,
                resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading) {

        super(resourcesComponent, viewFacade, loading);
    }


    async ngOnChanges() {

        await this.updateImages();
    }


    public getImageUrls(document: FieldDocument): Array<SafeResourceUrl> {

        return this.images[document.resource.id] ?? [];
    }


    public async open(document: FieldDocument) {

        await this.viewFacade.moveInto(document);
    }


    private async updateImages() {

        this.images = await asyncReduce(
            async (images: { [resourceId: string]: Array<SafeResourceUrl> }, document: FieldDocument) => {
                images[document.resource.id] = await this.getImages(document);
                return images;
            }, {})(this.documents);
    }


    private async getImages(document: FieldDocument): Promise<Array<SafeResourceUrl>> {

        const linkedImages: Array<ImageRowItem>
            = (await TypeImagesUtil.getLinkedImages(document, this.fieldDatastore))
                .filter(image => image.imageId !== PLACEHOLDER);

        return asyncMap((image: ImageRowItem) => {
            return this.imagestore.read(image.imageId, false, true);
        })(take(4)(await this.getSortedImages(linkedImages)));
    }


    private async getSortedImages(images: Array<ImageRowItem>): Promise<Array<ImageRowItem>> {

        const imageDocuments: Array<ImageDocument> = await this.imageDatastore.getMultiple(
            images.map(image => image.imageId)
        );

        return images.sort((a: ImageRowItem, b: ImageRowItem) => {
            const heightA: number = this.getHeight(a, imageDocuments);
            const heightB: number = this.getHeight(b, imageDocuments);

            return heightA > heightB
                 ? 1
                 : heightA === heightB
                     ? 0
                     : -1;
        });
    }


    private getHeight(image: ImageRowItem, imageDocuments: Array<ImageDocument>): number {

        const document: ImageDocument|undefined
            = imageDocuments.find(imageDocument => imageDocument.resource.id === image.imageId);

        if (!document) {
            console.warn('Document ' + image.imageId + ' not found!');
            return 0;
        }

        return ImageWidthCalculator.computeHeight(
            document.resource.width, document.resource.height, 150, 150
        );
    }
}
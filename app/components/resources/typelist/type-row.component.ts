import {Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {TypeImagesUtil} from '../../../core/util/type-images-util';
import {ResourcesComponent} from '../resources.component';
import {ImageModalLauncher} from '../service/image-modal-launcher';
import {ImageRowItem} from '../../image/row/image-row.component';


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

    public numberOfLinkedResources: number = -1;
    public linkedImages: Array<ImageRowItem>;


    constructor(private datastore: FieldReadDatastore,
                private resourcesComponent: ResourcesComponent,
                private imageModalLauncher: ImageModalLauncher) {}


    public highlightDocument = (document: FieldDocument|undefined) =>
        this.resourcesComponent.highlightDocument(document);


    async ngOnChanges() {

        this.numberOfLinkedResources = await this.getNumberOfLinkedResources();
        this.linkedImages = await this.getLinkedImages();
    }


    public async openImageModal(image: ImageRowItem) {

        await this.imageModalLauncher.openImageModal(image.resource, this.resourcesComponent);
    }


    public async openDoceditModal() {

        await this.resourcesComponent.editDocument(this.document);
    }


    private getLinkedImages(): Promise<Array<ImageRowItem>> {

        return TypeImagesUtil.getLinkedImages(this.document, this.datastore);
    }


    private async getNumberOfLinkedResources(): Promise<number> {

        const relationName: string = this.document.resource.type === 'TypeCatalog'
            ? 'liesWithin'
            : 'isInstanceOf';

        const constraints: { [constraintName: string]: string } = {};
        constraints[relationName + ':contain'] = this.document.resource.id;

        return (await this.datastore.find({ constraints: constraints })).totalCount;
    }
}
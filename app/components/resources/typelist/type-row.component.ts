import {Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {TypeImagesUtil} from '../../../core/util/type-images-util';
import {ResourcesComponent} from '../resources.component';


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

    public linkedImagesIds: string[];


    constructor(private fieldDatastore: FieldReadDatastore,
                private resourcesComponent: ResourcesComponent) {}


    public highlightDocument = (document: FieldDocument|undefined) =>
        this.resourcesComponent.highlightDocument(document);


    async ngOnChanges() {

        await this.updateLinkedImages(this.document);
    }


    private async updateLinkedImages(document: FieldDocument) {

        this.linkedImagesIds = await TypeImagesUtil.getIdsOfLinkedImages(document, this.fieldDatastore);
    }
}
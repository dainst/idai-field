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

    public numberOfLinkedResources: number = -1;
    public linkedImagesIds: string[];


    constructor(private datastore: FieldReadDatastore,
                private resourcesComponent: ResourcesComponent) {}


    public highlightDocument = (document: FieldDocument|undefined) =>
        this.resourcesComponent.highlightDocument(document);


    async ngOnChanges() {

        this.numberOfLinkedResources = await this.getNumberOfLinkedResources();
        this.linkedImagesIds = await this.getLinkedImagesIds();
    }


    private getLinkedImagesIds(): Promise<string[]> {

        return TypeImagesUtil.getIdsOfLinkedImages(this.document, this.datastore);
    }


    private async getNumberOfLinkedResources(): Promise<number> {

        const relationName: string = this.document.resource.type === 'TypeCatalog'
            ? 'liesWithin'
            : 'isInstanceOf';

        const constraints: { [constraintName: string]: string } = {};
        constraints[relationName + ':contain'] = this.document.resource.id;

        return (await this.datastore.find({ q: '', constraints: constraints })).totalCount;
    }
}
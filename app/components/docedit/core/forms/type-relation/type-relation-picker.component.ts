import {Component} from '@angular/core';
import {Pair, first, second} from 'tsfun';
import {asyncMap} from 'tsfun-extra';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Resource, FieldDocument} from 'idai-components-2/index';
import {FieldReadDatastore} from '../../../../../core/datastore/field/field-read-datastore';
import {TypeImagesUtil} from '../../../../../core/util/type-images-util';
import getIdsOfLinkedImages = TypeImagesUtil.getIdsOfLinkedImages;


@Component({
    selector: 'type-relation-picker',
    moduleId: module.id,
    templateUrl: './type-relation-picker.html'
})
/**
 * @author Daniel de Oliveira
 */
export class TypeRelationPickerComponent {

    public resource: Resource | undefined = undefined;

    public timeoutRef: any;

    public typeDocument = first;
    public imageIds = second;
    public typeDocumentsWithLinkedImageIds: Array<Pair<FieldDocument, string[]>> = [];


    constructor(public activeModal: NgbActiveModal,
                public datastore: FieldReadDatastore) {

        this.fetchTypes();
    }


    public setResource(resource: Resource) {

        this.resource = resource;
    }


    public setQueryString(q: string) {

        if (this.timeoutRef) clearTimeout(this.timeoutRef);
        this.timeoutRef = setTimeout(() => this.fetchTypes(q), 200);
    }


    private async fetchTypes(q: string = '') {

        const documents = (await this.datastore.find({q: q, types: ['Type']})).documents;
        this.typeDocumentsWithLinkedImageIds =
            await this.pairWithLinkedImageIds(documents);
    }


    private pairWithLinkedImageIds = asyncMap(async (document: FieldDocument) => {
        return [
            document,
            await getIdsOfLinkedImages(document, this.datastore)
        ] as Pair<FieldDocument, string[]>;
    });
}
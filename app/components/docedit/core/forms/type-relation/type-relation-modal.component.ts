import {Component} from '@angular/core';
import {asyncMap} from 'tsfun-extra';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Resource, FieldDocument} from 'idai-components-2/index';
import {FieldReadDatastore} from '../../../../../core/datastore/field/field-read-datastore';
import {TypeImagesUtil} from '../../../../../core/util/type-images-util';


@Component({
    selector: 'type-relation-modal',
    moduleId: module.id,
    templateUrl: './type-relation-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class TypeRelationModalComponent {

    public resource: Resource | undefined = undefined;


    public typeDocumentsWithLinkedImageIds: Array<[FieldDocument, string[]]> = [];


    constructor(public activeModal: NgbActiveModal,
                public datastore: FieldReadDatastore) {

        this.fetchTypes();
    }


    private async fetchTypes() {

        const result = await this.datastore.find({q: '', types: ['Type']});
        this.typeDocumentsWithLinkedImageIds = await asyncMap(async (document: FieldDocument) => {
            return [
                document,
                await TypeImagesUtil.getIdsOfLinkedImages(document, this.datastore)
            ] as [FieldDocument, string[]];
        })(result.documents);
    }


    public setResource(resource: Resource) {

        this.resource = resource;
    }
}
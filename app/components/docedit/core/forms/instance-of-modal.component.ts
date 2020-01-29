import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Resource, FieldDocument} from 'idai-components-2/index';
import {FieldReadDatastore} from '../../../../core/datastore/field/field-read-datastore';


@Component({
    selector: 'instance-of-modal',
    moduleId: module.id,
    templateUrl: './instance-of-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class InstanceOfModalComponent {

    public resource: Resource | undefined = undefined;

    public typeDocuments: Array<FieldDocument> = [];


    constructor(public activeModal: NgbActiveModal,
                public datastore: FieldReadDatastore) {

        console.log(':', 'construct instance-of-modal-component');
        this.fetchTypes();
    }


    private async fetchTypes() {

        const result = await this.datastore.find({q: '', types: ['Type']});
        this.typeDocuments = result.documents;
    }


    public setResource(resource: Resource) {

        this.resource = resource;
        console.log(':', ' instance-of-modal-component set resource', resource);
    }
}
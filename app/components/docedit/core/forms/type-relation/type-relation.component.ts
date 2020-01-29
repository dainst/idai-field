import {Component, Input} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Resource} from 'idai-components-2';
import {ImageReadDatastore} from '../../../../../core/datastore/field/image-read-datastore';
import {DoceditComponent} from '../../../docedit.component';
import {TypeRelationModalComponent} from './type-relation-modal.component';


@Component({
    moduleId: module.id,
    selector: 'dai-type-relation',
    templateUrl: './type-relation.html'
})

/**
 * @author Daniel de Oliveira
 */
export class TypeRelationComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;


    constructor(private datastore: ImageReadDatastore,
                private modalService: NgbModal,
                private doceditComponent: DoceditComponent) {}


    public async openInstanceOfModal () {

        this.doceditComponent.subModalOpened = true;

        const instanceOfModal: NgbModalRef = this.modalService.open(
            TypeRelationModalComponent, { size: 'lg', keyboard: false }
        );
        instanceOfModal.componentInstance.setResource(this.resource);

        try {
            await instanceOfModal.result;
        } catch(err) {
            // Image picker modal has been canceled
        } finally {
            this.doceditComponent.subModalOpened = false;
        }
    }
}
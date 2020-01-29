import {unique} from 'tsfun';
import {Component, Input} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Resource} from 'idai-components-2';
import {ImageReadDatastore} from '../../../../../core/datastore/field/image-read-datastore';
import {DoceditComponent} from '../../../docedit.component';
import {TypeRelationPickerComponent} from './type-relation-picker.component';

const INSTANCE_OF = 'isInstanceOf';

@Component({
    moduleId: module.id,
    selector: 'dai-type-relation',
    templateUrl: './type-relation.html'
})
/**
 * TODO make that it has the functionality of relation-picker-group, so it behaves alike and so that types can be removed
 *
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

        const typeRelationPicker: NgbModalRef = this.modalService.open(
            TypeRelationPickerComponent, { size: 'lg', keyboard: false }
        );
        typeRelationPicker.componentInstance.setResource(this.resource);

        try {
            const result = await typeRelationPicker.result;

            if (!this.resource.relations[INSTANCE_OF]) this.resource.relations[INSTANCE_OF];
            this.resource.relations[INSTANCE_OF] =
                unique(this.resource.relations[INSTANCE_OF].concat(result.resource.id))

        } catch(err) {
            // Image picker modal has been canceled
        } finally {
            this.doceditComponent.subModalOpened = false;
        }
    }
}
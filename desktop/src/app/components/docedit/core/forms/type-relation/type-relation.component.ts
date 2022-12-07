import { Component, Input, OnChanges } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { to, set } from 'tsfun';
import { Datastore, Resource } from 'idai-field-core';
import { TypeRelationPickerComponent } from './type-relation-picker.component';
import { MenuContext } from '../../../../../services/menu-context';
import { Menus } from '../../../../../services/menus';


type ResourceIdentifier = string;
const INSTANCE_OF = 'isInstanceOf';
const toResourceIdentifier = to(['resource','identifier']);


@Component({
    selector: 'form-field-type-relation',
    templateUrl: './type-relation.html'
})
/**
 * @author Daniel de Oliveira
 */
export class TypeRelationComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() fieldName: string;

    public relationIdentifiers: Array<ResourceIdentifier> = [];


    constructor(private datastore: Datastore,
                private modalService: NgbModal,
                private menuService: Menus) {}


    ngOnChanges() {

        this.fetchRelationIdentifiers();
    }


    public async openInstanceOfModal() {

        this.menuService.setContext(MenuContext.MODAL);

        const typeRelationPicker: NgbModalRef = this.modalService.open(
            TypeRelationPickerComponent, { size: 'lg', keyboard: false, animation: false }
        );
        await typeRelationPicker.componentInstance.setResource(this.resource);

        try {
            const result = await typeRelationPicker.result;
            this.addRelation(result.resource.id);
        } catch { // cancelled
        } finally {
            this.menuService.setContext(MenuContext.DOCEDIT);
        }
    }


    private async fetchRelationIdentifiers() {

        if (!this.relations()) return;
        const documents = await this.datastore.getMultiple(this.relations());
        this.relationIdentifiers = documents.map(toResourceIdentifier);
    }


    private addRelation(resourceId: string) {

        if (!this.relations()) this.makeRelations();
        this.resource.relations[INSTANCE_OF] = set(this.relations().concat(resourceId));
        this.fetchRelationIdentifiers();
    }


    private relations() {

        return this.resource.relations[INSTANCE_OF];
    }


    private makeRelations() {

        this.resource.relations[INSTANCE_OF] = [];
    }


    public deleteRelation(i: number) {

        this.relations().splice(i, 1);
        this.relationIdentifiers.splice(i, 1);

        if (this.relations().length === 0) {

            delete this.resource.relations[INSTANCE_OF];
            this.relationIdentifiers = [];
        }
    }
}

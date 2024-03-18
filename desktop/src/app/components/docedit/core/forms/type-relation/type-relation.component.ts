import { Component, Input, OnChanges } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { set } from 'tsfun';
import { Datastore, FieldDocument, Relation, Resource } from 'idai-field-core';
import { TypeRelationPickerComponent } from './type-relation-picker.component';
import { MenuContext } from '../../../../../services/menu-context';
import { Menus } from '../../../../../services/menus';


@Component({
    selector: 'form-field-type-relation',
    templateUrl: './type-relation.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class TypeRelationComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() fieldName: string;

    public targetDocuments: Array<FieldDocument> = [];


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
        } catch {
            // cancelled
        } finally {
            this.menuService.setContext(MenuContext.DOCEDIT);
        }
    }


    private async fetchRelationIdentifiers() {

        if (!this.getRelations()) return;
        this.targetDocuments = await this.datastore.getMultiple(this.getRelations()) as Array<FieldDocument>;
    }


    private addRelation(resourceId: string) {

        if (!this.getRelations()) this.makeRelations();
        this.resource.relations[Relation.Type.INSTANCEOF] = set(this.getRelations().concat(resourceId));
        this.fetchRelationIdentifiers();
    }


    private getRelations() {

        return this.resource.relations[Relation.Type.INSTANCEOF];
    }


    private makeRelations() {

        this.resource.relations[Relation.Type.INSTANCEOF] = [];
    }


    public deleteRelation(i: number) {

        this.getRelations().splice(i, 1);
        this.targetDocuments.splice(i, 1);

        if (this.getRelations().length === 0) {
            delete this.resource.relations[Relation.Type.INSTANCEOF];
            this.targetDocuments = [];
        }
    }
}

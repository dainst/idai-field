import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Field } from 'idai-field-core';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';


@Component({
    templateUrl: './delete-field-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DeleteFieldModalComponent {

    public field: Field;
    public category: CategoryForm;


    constructor(public activeModal: NgbActiveModal,
                private menuService: Menus) {}


    public isInverseRelation = () => this.field['inverse'] !== undefined && this.field['inverse'] !== this.field.name;

    public isDeletionAllowed = () => !this.isInverseRelation() && !this.getConditionalFieldName();


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.CONFIGURATION_MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }


    public confirmDeletion() {

        if (this.isDeletionAllowed()) this.activeModal.close();
    }


    public getConditionalFieldName(): string|undefined {

        let conditionalField: Field = undefined;

        for (let category of this.category.children.concat([this.category])) {
            conditionalField = CategoryForm.getFields(category).find(field => {
                return field.condition?.fieldName === this.field.name;
            });
            if (conditionalField) break;
        }

        return conditionalField?.name;
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}

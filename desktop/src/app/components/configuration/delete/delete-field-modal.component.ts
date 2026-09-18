import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Field, Labels } from 'idai-field-core';
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

    public conditionalFieldName: string;
    public conditionalFieldSubcategory: CategoryForm;



    constructor(public activeModal: NgbActiveModal,
                private menuService: Menus,
                private labels: Labels) {}


    public isInverseRelation = () => this.field['inverse'] !== undefined && this.field['inverse'] !== this.field.name;

    public isDeletionAllowed = () => !this.isInverseRelation() && !this.conditionalFieldName;

    public getCategoryLabel = (category: CategoryForm) => this.labels.get(category);


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.CONFIGURATION_MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }


    public initialize() {

        this.updateConditionalFieldName();
    }


    public confirmDeletion() {

        if (this.isDeletionAllowed()) this.activeModal.close();
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    private updateConditionalFieldName() {

        for (let category of [this.category].concat(this.category.children)) {
            const conditionalField: Field = CategoryForm.getFields(category).find(field => {
                return field.condition?.fieldName === this.field.name;
            });

            if (conditionalField) {
                this.conditionalFieldName = conditionalField?.name;
                if (category !== this.category) this.conditionalFieldSubcategory = category;
                break;
            }
        }
    }
}

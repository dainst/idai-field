import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Field } from 'idai-field-core';


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


    constructor(public activeModal: NgbActiveModal) {}


    public isInverseRelation = () => this.field['inverse'] !== undefined;

    public isDeletionAllowed = () => !this.isInverseRelation() && !this.getConditionalFieldName();


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public confirmDeletion() {

        if (this.isDeletionAllowed()) this.activeModal.close();
    }


    public getConditionalFieldName(): string|undefined {

        const conditionalField: Field = CategoryForm.getFields(this.category).find(field => {
            return field.condition?.fieldName === this.field.name;
        });

        return conditionalField?.name;
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm } from 'idai-field-core';


@Component({
    templateUrl: './swap-category-form-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class SwapCategoryFormModalComponent {

    public currentForm: CategoryForm;
    public newForm: CategoryForm;

    public confirmSwappingFormName: string;


    constructor(public activeModal: NgbActiveModal) {}


    public confirmSwapping = () => this.checkConfirmSwappingFormName() && this.activeModal.close();
    
    public checkConfirmSwappingFormName = () => this.confirmSwappingFormName === this.newForm.libraryId;

    public hasChildCategories = (categoryForm: CategoryForm) => categoryForm.children?.length > 0;

    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }
}

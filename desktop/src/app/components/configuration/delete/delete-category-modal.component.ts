import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Labels } from 'idai-field-core';


@Component({
    templateUrl: './delete-category-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class DeleteCategoryModalComponent {

    public category: CategoryForm;
    public labels: Labels;
    public customized: boolean;
    public resourceCount: number;

    public confirmDeletionCategoryName: string;


    constructor(public activeModal: NgbActiveModal) {}


    public hasChildCategories = (): boolean => this.category.children.length > 0;

    public isConfirmationDialogVisible = () => this.customized || this.resourceCount > 0;

    public confirmDeletion = () => (!this.isConfirmationDialogVisible() || this.checkConfirmDeletionCategoryName())
        && this.activeModal.close();
    
    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public checkConfirmDeletionCategoryName(): boolean {
        
        return this.confirmDeletionCategoryName === this.category.name
            || this.confirmDeletionCategoryName === this.labels.get(this.category);
    };
}

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Category } from 'idai-field-core';


@Component({
    templateUrl: './delete-category-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class DeleteCategoryModalComponent {

    public category: Category;
    public confirmDeletionCategoryName: string;


    constructor(public activeModal: NgbActiveModal) {}


    public hasCustomFields = (): boolean => Category.hasCustomFields(this.category);

    public confirmDeletion = () => this.checkConfirmDeletionCategoryName() && this.activeModal.close();
    
    public cancel = () => this.activeModal.dismiss('cancel');

    public checkConfirmDeletionCategoryName = () => this.confirmDeletionCategoryName === this.category.name;
}

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Category, Labels } from 'idai-field-core';


@Component({
    templateUrl: './delete-category-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class DeleteCategoryModalComponent {

    public category: Category;
    public labels: Labels;

    public confirmDeletionCategoryName: string;


    constructor(public activeModal: NgbActiveModal) {}


    public hasCustomFields = (): boolean => Category.hasCustomFields(this.category);

    public confirmDeletion = () => this.checkConfirmDeletionCategoryName() && this.activeModal.close();
    
    public cancel = () => this.activeModal.dismiss('cancel');


    public checkConfirmDeletionCategoryName(): boolean {
        
        return this.confirmDeletionCategoryName === this.category.name
            || this.confirmDeletionCategoryName === this.labels.get(this.category);
    };
}

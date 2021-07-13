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


    constructor(public activeModal: NgbActiveModal) {}


    public confirmDeletion() {

        this.activeModal.close();
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}

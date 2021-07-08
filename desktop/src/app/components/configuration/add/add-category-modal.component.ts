import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BuiltInConfiguration, ConfigReader, ConfigLoader, Category } from 'idai-field-core';
import { ConfigurationIndex } from '../../../core/configuration/configuration-index';


@Component({
    templateUrl: './add-category-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class AddCategoryModalComponent {

    public categoryName: string;


    constructor(public activeModal: NgbActiveModal) {}


    public createCategory() {

        if (!this.categoryName) return;

        this.activeModal.close(this.categoryName);
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }
}

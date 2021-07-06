import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfigReader } from 'idai-field-core';
import { ConfigurationIndex } from '../../../core/configuration/configuration-index';


@Component({
    templateUrl: './add-category-modal.html'
})
/**
 * @author Thomas Kleinke
 */
export class AddCategoryModalComponent {

    public categoryName: string;

    public configurationIndex = {};


    constructor(public activeModal: NgbActiveModal,
                private configReader: ConfigReader) {

        this.readConfig();
    }


    private async readConfig() {

        let config;
        try {
            config = await this.configReader.read('/Library/Categories.json');
        } catch (e) {
            console.error('error while reading config in AddCategoryModalComponent', e);
        }
    }


    public createCategory() {

        if (!this.categoryName) return;

        this.activeModal.close(this.categoryName);
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public changeCategoryNameInput() {

        console.log("categoryName",
            ConfigurationIndex.find(this.configurationIndex, this.categoryName));
    }
}

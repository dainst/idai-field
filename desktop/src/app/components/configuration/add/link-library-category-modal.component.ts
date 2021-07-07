import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BuiltInConfiguration, ConfigReader, ConfigLoader, Category } from 'idai-field-core';
import { ConfigurationIndex } from '../../../core/configuration/configuration-index';


@Component({
    templateUrl: './link-library-category-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class LinkLibraryCategoryModalComponent {

    public categoryName: string;

    public parentCategory: Category;

    public category: Category|undefined;

    public categories: Array<Category> = [];

    private configurationIndex = {};


    constructor(public activeModal: NgbActiveModal,
                private configReader: ConfigReader,
                private configLoader: ConfigLoader) {

        this.readConfig();
    }


    private async readConfig() {

        try {
            const config = await this.configReader.read('/Library/Categories.json');
            const languages = await this.configLoader.readDefaultLanguageConfigurations();
            this.configurationIndex = ConfigurationIndex.create(
                new BuiltInConfiguration('').builtInCategories,
                config,
                languages);
        } catch (e) {
            console.error('error while reading config in AddCategoryModalComponent', e);
        }
    }


    public selectCategory(category: Category) {

        this.category = category;
    }


    public createCategory() {

        if (!this.categoryName) return;

        this.activeModal.close(this.categoryName);
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public changeCategoryNameInput() {

        // TODO Take language into account, too

        this.categories =
            ConfigurationIndex.find(this.configurationIndex, this.categoryName)
                .filter(category => category['parent'] === this.parentCategory.name);
        console.log("result", this.categories)
    }
}

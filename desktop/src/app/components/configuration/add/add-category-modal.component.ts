import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, Category, ConfigurationDocument } from 'idai-field-core';
import { ConfigurationIndex } from '../../../core/configuration/configuration-index';
import { MenuContext } from '../../../services/menu-context';
import { AngularUtility } from '../../../angular/angular-utility';
import { CategoryEditorModalComponent } from '../editor/category-editor-modal.component';
import { ErrWithParams } from '../../../core/import/import/import-documents';
import { Modals } from '../../../services/modals';
import { ConfigurationUtil } from '../../../core/configuration/configuration-util';


@Component({
    templateUrl: './add-category-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class AddCategoryModalComponent {

    public configurationIndex: ConfigurationIndex;
    public configurationDocument: ConfigurationDocument;
    public parentCategory: Category;
    public categoryToReplace?: Category;
    public projectCategoryNames?: string[];

    public searchTerm: string = '';
    public selectedCategory: Category|undefined;
    public categories: Array<Category> = [];

    public saveAndReload: (configurationDocument: ConfigurationDocument, reindexCategory?: string) =>
        Promise<ErrWithParams|undefined>;


    constructor(public activeModal: NgbActiveModal,
                private modals: Modals) {}


    public init() {

        this.applyCategoryNameSearch();
    }


    public selectCategory(category: Category) {

        this.selectedCategory = category;
    }


    public addSelectedCategory() {

        if (!this.selectedCategory) return;

        const clonedConfigurationDocument = this.categoryToReplace
            ? ConfigurationUtil.deleteCategory(this.categoryToReplace, this.configurationDocument, false)
            : Document.clone(this.configurationDocument);

        clonedConfigurationDocument.resource.categories[this.selectedCategory.libraryId] = {
            fields: {},
            hidden: []
        };

        try {
            this.saveAndReload(clonedConfigurationDocument, this.selectedCategory.name);
            this.activeModal.close();
        } catch { /* stay in modal */ }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public applyCategoryNameSearch() {

        this.categories = ConfigurationIndex
            .find(this.configurationIndex, this.searchTerm, this.parentCategory?.name,
                !this.parentCategory && !this.categoryToReplace)
            .filter(category =>
                !Object.keys(this.configurationDocument.resource.categories).includes(
                    category.libraryId ?? category.name
                ) && (!this.projectCategoryNames || !this.projectCategoryNames.includes(category.name))
                && (!this.categoryToReplace || category.name === this.categoryToReplace.name)
            );

        this.selectedCategory = this.categories?.[0];
    }


    public async createNewSubcategory() {

        const [result, componentInstance] = this.modals.make<CategoryEditorModalComponent>(
            CategoryEditorModalComponent,
            MenuContext.CONFIGURATION_EDIT,
            'lg'
        );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = Category.build(this.searchTerm, this.parentCategory);
        componentInstance.new = true;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            () => this.activeModal.close(),
            () => AngularUtility.blurActiveElement()
        );
    }
}

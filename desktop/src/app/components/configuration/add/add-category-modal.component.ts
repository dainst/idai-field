import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, Category, ConfigurationDocument } from 'idai-field-core';
import { ConfigurationIndex } from '../../../core/configuration/configuration-index';
import { MenuContext } from '../../../services/menu-context';
import { AngularUtility } from '../../../angular/angular-utility';
import { CategoryEditorModalComponent } from '../editor/category-editor-modal.component';
import { ErrWithParams } from '../../../core/import/import/import-documents';
import { Modals } from '../../../services/modals';


@Component({
    templateUrl: './add-category-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class AddCategoryModalComponent {

    public searchTerm: string = '';
    public configurationDocument: ConfigurationDocument;
    public parentCategory: Category;
    public selectedCategory: Category|undefined;
    public categories: Array<Category> = [];
    public configurationIndex: ConfigurationIndex = {};

    public saveAndReload: (configurationDocument: ConfigurationDocument) =>
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

        const configurationDocument = Document.clone(this.configurationDocument);
        configurationDocument.resource.categories[this.selectedCategory.name] = {
            fields: {},
            hidden: []
        };

        try {
            this.saveAndReload(configurationDocument);
            this.activeModal.close();
        } catch { /* stay in modal */ }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public applyCategoryNameSearch() {

        this.categories = ConfigurationIndex
            .find(this.configurationIndex, this.searchTerm, this.parentCategory.name)
            .filter(category =>
                !Object.keys(this.configurationDocument.resource.categories).includes(
                    category.libraryId ?? category.name
                )
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

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, CategoryForm, ConfigurationDocument, SortUtil } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { MenuContext } from '../../../../services/menu-context';
import { AngularUtility } from '../../../../angular/angular-utility';
import { CategoryEditorModalComponent } from '../../editor/category-editor-modal.component';
import { Modals } from '../../../../services/modals';
import { ConfigurationUtil } from '../../configuration-util';
import { SaveResult } from '../../configuration.component';


@Component({
    templateUrl: './add-category-form-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class AddCategoryFormModalComponent {

    public configurationDocument: ConfigurationDocument;
    public parentCategory: CategoryForm|undefined;
    public categoryToReplace?: CategoryForm;
    public projectCategoryNames?: string[];
    public saveAndReload: (configurationDocument: ConfigurationDocument, reindexCategory?: string) =>
        Promise<SaveResult>;

    public searchTerm: string = '';
    public selectedForm: CategoryForm|undefined;
    public emptyForm: CategoryForm|undefined;
    public categoryForms: Array<CategoryForm> = [];


    constructor(public activeModal: NgbActiveModal,
                private configurationIndex: ConfigurationIndex,
                private modals: Modals) {}


    public initialize() {

        this.applyCategoryNameSearch();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public selectForm(category: CategoryForm) {

        this.selectedForm = category;
    }


    public confirmSelection() {

        if (!this.selectedForm) return;

        if (this.selectedForm === this.emptyForm) {
            this.createNewSubcategory();
        } else {
            this.addSelectedCategory();
        }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public applyCategoryNameSearch() {

        this.categoryForms = this.configurationIndex
            .findCategoryForms(this.searchTerm, this.parentCategory?.name,
                !this.parentCategory && !this.categoryToReplace)
            .filter(category =>
                !Object.keys(this.configurationDocument.resource.forms).includes(
                    category.libraryId ?? category.name
                ) && (!this.projectCategoryNames || !this.projectCategoryNames.includes(category.name))
                && (!this.categoryToReplace || category.name === this.categoryToReplace.name)
            )
            .sort((categoryForm1, categoryForm2) => SortUtil.alnumCompare(
                categoryForm1.libraryId ?? categoryForm1.name,
                categoryForm2.libraryId ?? categoryForm2.name
            ));

        this.selectedForm = this.categoryForms?.[0];
        this.emptyForm = this.getEmptyForm();
    }


    private addSelectedCategory() {

        const clonedConfigurationDocument = this.categoryToReplace
            ? ConfigurationDocument.deleteCategory(this.configurationDocument, this.categoryToReplace, false)
            : Document.clone(this.configurationDocument);

        clonedConfigurationDocument.resource.forms[this.selectedForm.libraryId] = {
            fields: {},
            hidden: []
        };

        if (!this.categoryToReplace) {
            clonedConfigurationDocument.resource.order = ConfigurationUtil.addToCategoriesOrder(
                clonedConfigurationDocument.resource.order, this.selectedForm.name, this.parentCategory?.name
            );
        }

        try {
            this.saveAndReload(clonedConfigurationDocument, this.selectedForm.name);
            this.activeModal.close();
        } catch { /* stay in modal */ }
    }


    private async createNewSubcategory() {

        const [result, componentInstance] = this.modals.make<CategoryEditorModalComponent>(
            CategoryEditorModalComponent,
            MenuContext.CONFIGURATION_EDIT,
            'lg'
        );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = CategoryForm.build(this.searchTerm, this.parentCategory);
        componentInstance.new = true;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            () => this.activeModal.close(),
            () => AngularUtility.blurActiveElement()
        );
    }


    private getEmptyForm(): CategoryForm|undefined {

        if (!this.parentCategory?.userDefinedSubcategoriesAllowed || this.searchTerm.length === 0) return undefined;

        return {
            libraryId: this.searchTerm,
            groups: this.parentCategory.groups
        } as CategoryForm;
    }
}

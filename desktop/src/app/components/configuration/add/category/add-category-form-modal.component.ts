import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, ConfigurationDocument, ProjectConfiguration, SortUtil } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { MenuContext } from '../../../../services/menu-context';
import { AngularUtility } from '../../../../angular/angular-utility';
import { CategoryEditorModalComponent } from '../../editor/category-editor-modal.component';
import { Modals } from '../../../../services/modals';
import { SaveResult } from '../../configuration.component';
import { SwapCategoryFormModalComponent } from './swap-category-form-modal.component';
import { Menus } from '../../../../services/menus';
import { CategoriesFilter, ConfigurationUtil } from '../../configuration-util';


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
    public categoriesFilter?: CategoriesFilter;
    public categoryFormToReplace?: CategoryForm;
    public projectCategoryNames?: string[];
    public saveAndReload: (configurationDocument: ConfigurationDocument, reindexCategory?: string,
                           reindexConfiguration?: boolean) => Promise<SaveResult>;

    public searchTerm: string = '';
    public selectedForm: CategoryForm|undefined;
    public emptyForm: CategoryForm|undefined;
    public categoryForms: Array<CategoryForm> = [];


    constructor(public activeModal: NgbActiveModal,
                private configurationIndex: ConfigurationIndex,
                private projectConfiguration: ProjectConfiguration,
                private modals: Modals,
                private menus: Menus) {}


    public initialize() {

        this.applyCategoryNameSearch();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.CONFIGURATION_MANAGEMENT) {
            this.activeModal.dismiss('cancel');
        }
    }


    public selectForm(category: CategoryForm) {

        this.selectedForm = category;
    }


    public confirmSelection() {

        if (!this.selectedForm) return;

        if (this.selectedForm === this.emptyForm) {
            this.createNewSubcategory();
        } else if (this.categoryFormToReplace && ConfigurationDocument.isCustomizedCategory(
                this.configurationDocument, this.categoryFormToReplace, true)) {
            this.showSwapConfirmationModal();
        } else {
            this.addSelectedCategory();
        }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public applyCategoryNameSearch() {

        const categoryForms: Array<CategoryForm> = this.configurationIndex
            .findCategoryForms(this.searchTerm, this.parentCategory?.name,
                !this.parentCategory && !this.categoryFormToReplace)
            .filter(category =>
                !Object.keys(this.configurationDocument.resource.forms).includes(
                    category.libraryId ?? category.name
                ) && (!this.projectCategoryNames || !this.projectCategoryNames.includes(category.name))
                && (!this.categoryFormToReplace || category.name === this.categoryFormToReplace.name)
            )
            .sort((categoryForm1, categoryForm2) => SortUtil.alnumCompare(
                categoryForm1.libraryId ?? categoryForm1.name,
                categoryForm2.libraryId ?? categoryForm2.name
            ));

        this.categoryForms = this.parentCategory
            ? categoryForms
            : ConfigurationUtil.filterTopLevelCategories(
                categoryForms, this.categoriesFilter, this.projectConfiguration
            );

        this.selectedForm = this.categoryForms?.[0];
        this.emptyForm = this.getEmptyForm();
    }


    private addSelectedCategory() {

        const clonedConfigurationDocument = this.categoryFormToReplace
            ? ConfigurationDocument.swapCategoryForm(this.configurationDocument, this.categoryFormToReplace,
                this.selectedForm)
            : ConfigurationDocument.addCategoryForm(this.configurationDocument, this.selectedForm);

        try {
            this.saveAndReload(clonedConfigurationDocument, this.selectedForm.name, true);
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


    private async showSwapConfirmationModal() {

        const [result, componentInstance] = this.modals.make<SwapCategoryFormModalComponent>(
            SwapCategoryFormModalComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        componentInstance.currentForm = this.categoryFormToReplace;
        componentInstance.newForm = this.selectedForm;

        this.modals.awaitResult(result,
            () => this.addSelectedCategory(),
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

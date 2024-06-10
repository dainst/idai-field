import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, ConfigurationDocument, ProjectConfiguration, SortUtil } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { MenuContext } from '../../../../services/menu-context';
import { AngularUtility } from '../../../../angular/angular-utility';
import { CategoryEditorModalComponent } from '../../editor/category/category-editor-modal.component';
import { Modals } from '../../../../services/modals';
import { SwapCategoryFormModalComponent } from './swap-category-form-modal.component';
import { Menus } from '../../../../services/menus';
import { CategoriesFilter, ConfigurationUtil } from '../../configuration-util';
import { SettingsProvider } from '../../../../services/settings/settings-provider';
import { Naming } from '../naming';


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
    public clonedProjectConfiguration: ProjectConfiguration;
    public parentCategory: CategoryForm|undefined;
    public categoriesFilter?: CategoriesFilter;
    public categoryFormToReplace?: CategoryForm;
    public projectCategoryNames?: string[];
    public applyChanges: (configurationDocument: ConfigurationDocument,
        reindexConfiguration?: boolean) => Promise<void>;

    public searchTerm: string = '';
    public selectedForm: CategoryForm|undefined;
    public emptyForm: CategoryForm|undefined;
    public categoryForms: Array<CategoryForm> = [];


    constructor(public activeModal: NgbActiveModal,
                private configurationIndex: ConfigurationIndex,
                private modals: Modals,
                private menus: Menus,
                private settingsProvider: SettingsProvider) {}


    public initialize() {

        this.applyCategoryNameSearch();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.CONFIGURATION_MANAGEMENT) {
            this.activeModal.dismiss('cancel');
        }
    }


    public async selectForm(category: CategoryForm) {

        if (category === this.emptyForm) {
            await this.createNewSubcategory();
        } else {
            this.selectedForm = category;
        }
    }


    public confirmSelection() {

        if (!this.selectedForm) return;

        if (this.categoryFormToReplace && ConfigurationDocument.isCustomizedCategory(
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

        this.categoryForms = this.categoriesFilter
            ? ConfigurationUtil.filterTopLevelCategories(
                categoryForms, this.categoriesFilter, this.clonedProjectConfiguration
            )
            : categoryForms;

        this.selectedForm = this.categoryForms?.[0];
        this.emptyForm = this.getEmptyForm();
    }


    private addSelectedCategory() {

        const parentForm: CategoryForm|undefined = this.selectedForm.parentCategory
            ? this.clonedProjectConfiguration.getCategory(this.selectedForm.parentCategory.name)
            : undefined;

        const clonedConfigurationDocument = this.categoryFormToReplace
            ? ConfigurationDocument.swapCategoryForm(this.configurationDocument, this.categoryFormToReplace,
                this.selectedForm, parentForm)
            : ConfigurationDocument.addCategoryForm(this.configurationDocument, this.selectedForm, parentForm);

        try {
            this.applyChanges(clonedConfigurationDocument, true);
            this.activeModal.close(this.selectedForm);
        } catch { /* stay in modal */ }
    }


    private async createNewSubcategory() {

        const [result, componentInstance] = this.modals.make<CategoryEditorModalComponent>(
            CategoryEditorModalComponent,
            MenuContext.CONFIGURATION_EDIT,
            'lg'
        );

        componentInstance.applyChanges = this.applyChanges;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.clonedProjectConfiguration = this.clonedProjectConfiguration;
        componentInstance.category = CategoryForm.build(this.emptyForm.libraryId, this.parentCategory);
        componentInstance.new = true;
        componentInstance.numberOfCategoryResources = 0;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            () => this.activeModal.close(this.emptyForm),
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

        if (!this.parentCategory?.userDefinedSubcategoriesAllowed || this.searchTerm.length === 0) return undefined;

        const name: string = Naming.getCategoryName(this.searchTerm, this.settingsProvider.getSettings().selectedProject);

        return {
            name: name,
            libraryId: name,
            groups: this.parentCategory.groups
        } as CategoryForm;
    }
}

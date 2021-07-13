import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { set } from 'tsfun';
import { BuiltInConfiguration, Document, ConfigReader, ConfigLoader, Category, ConfigurationDocument } from 'idai-field-core';
import { ConfigurationIndex } from '../../../core/configuration/configuration-index';
import { MenuContext } from '../../services/menu-context';
import { AngularUtility } from '../../../angular/angular-utility';
import { CategoryEditorModalComponent } from '../editor/category-editor-modal.component';
import { ErrWithParams } from '../../../core/import/import/import-documents';
import {Modals} from '../../services/modals';


@Component({
    templateUrl: './add-category-modal.html'
})
/**
 * @author Daniel de Oliveira
 */
export class AddCategoryModalComponent {

    public categoryName: string;

    public configurationDocument: ConfigurationDocument;

    public parentCategory: Category;

    public category: Category|undefined;

    public categories: Array<Category> = [];

    private configurationIndex = {};

    public saveAndReload: (configurationDocument: ConfigurationDocument) =>
        Promise<ErrWithParams|undefined>;

    constructor(public activeModal: NgbActiveModal,
                private configReader: ConfigReader,
                private configLoader: ConfigLoader,
                private modals: Modals) {

        this.readConfig();
    }


    public selectCategory(category: Category) {

        this.category = category;
    }


    public createCategory() {

        if (!this.category) return;

        const configurationDocument = Document.clone(this.configurationDocument);
        configurationDocument.resource.categories[this.category.name] = {
            fields: {},
            hidden: []
        }
        try {
            this.saveAndReload(configurationDocument);
            this.activeModal.close();
        } catch { /* stay in modal */ }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public changeCategoryNameInput() {

        // TODO Take language into account, too

        this.categories = set(
            ConfigurationIndex.find(this.configurationIndex, this.categoryName)
                .filter(category => category['parentCategory'].name === this.parentCategory.name)) as any;
        if (this.categories.length > 0) this.category = this.categories[0];
    }


    public async createNewSubcategory(parentCategory: Category) {

        this.modals.setMenuContext(MenuContext.CONFIGURATION_EDIT);

        const [result, componentInstance] =
            this.modals.make<CategoryEditorModalComponent>(CategoryEditorModalComponent, 'lg');

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = {
            name: this.categoryName,
            label: {},
            defaultLabel: {},
            description: {},
            defaultDescription: {},
            parentCategory: parentCategory
        } as any /* TODO any */;
        componentInstance.new = true;
        componentInstance.initialize();

        try {
            await result;
            this.activeModal.close();
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.modals.setMenuContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    private async readConfig() {

        try {
            const builtInConfiguration = new BuiltInConfiguration('');
            const config = await this.configReader.read('/Library/Categories.json');
            const languages = await this.configLoader.readDefaultLanguageConfigurations();
            const [categories, configurationIndex] = ConfigurationIndex.create(
                builtInConfiguration.builtInCategories,
                builtInConfiguration.builtInRelations,
                config,
                languages);

            this.configurationIndex = configurationIndex;
            this.categories = categories
                .filter(category => category['parentCategory'].name === this.parentCategory.name) as any;
            if (this.categories.length > 0) this.category = this.categories[0];

        } catch (e) {
            console.error('error while reading config in AddCategoryModalComponent', e);
        }
    }
}

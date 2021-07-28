import { Component, OnDestroy, OnInit } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { nop, to } from 'tsfun';
import { Category, Datastore, ConfigurationDocument, ProjectConfiguration, Document, AppConfigurator,
    getConfigurationName, Field, Group, Groups, BuiltInConfiguration, ConfigReader, ConfigLoader,
    createContextIndependentCategories, Labels, IndexFacade, Tree } from 'idai-field-core';
import { TabManager } from '../../services/tabs/tab-manager';
import { Messages } from '../messages/messages';
import { MessagesConversion } from '../docedit/messages-conversion';
import { CategoryEditorModalComponent } from './editor/category-editor-modal.component';
import { AngularUtility } from '../../angular/angular-utility';
import { FieldEditorModalComponent } from './editor/field-editor-modal.component';
import { GroupEditorModalComponent } from './editor/group-editor-modal.component';
import { ConfigurationContextMenu } from './context-menu/configuration-context-menu';
import { ConfigurationContextMenuAction } from './context-menu/configuration-context-menu.component';
import { ComponentHelpers } from '../component-helpers';
import { DeleteFieldModalComponent } from './delete/delete-field-modal.component';
import { ConfigurationUtil } from '../../core/configuration/configuration-util';
import { DeleteGroupModalComponent } from './delete/delete-group-modal.component';
import { AddCategoryModalComponent } from './add/add-category-modal.component';
import { ErrWithParams } from '../../core/import/import/import-documents';
import { DeleteCategoryModalComponent } from './delete/delete-category-modal.component';
import { ConfigurationIndex } from '../../core/configuration/configuration-index';
import { SaveModalComponent } from './save-modal.component';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { Modals } from '../../services/modals';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';


export type InputType = {
    name: string;
    label: string;
    searchable?: boolean;
    customFields?: boolean;
};


@Component({
    templateUrl: './configuration.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:click)': 'onClick($event, false)',
        '(window:contextmenu)': 'onClick($event, true)'
    }
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ConfigurationComponent implements OnInit, OnDestroy {

    public topLevelCategoriesArray: Array<Category>;
    public selectedCategory: Category;
    public configurationDocument: ConfigurationDocument;
    public dragging: boolean = false;
    public contextMenu: ConfigurationContextMenu = new ConfigurationContextMenu();

    private configurationIndex: ConfigurationIndex = {};

    public availableInputTypes: Array<InputType> = [
        { name: 'input', label: this.i18n({ id: 'config.inputType.input', value: 'Einzeiliger Text' }), searchable: true, customFields: true },
        { name: 'multiInput', label: this.i18n({ id: 'config.inputType.multiInput', value: 'Einzeiliger Text mit Mehrfachauswahl' }), customFields: true },
        { name: 'text', label: this.i18n({ id: 'config.inputType.text', value: 'Mehrzeiliger Text' }), customFields: true },
        { name: 'unsignedInt', label: this.i18n({ id: 'config.inputType.unsignedInt', value: 'Positive Ganzzahl' }), searchable: true, customFields: true },
        { name: 'float', label: this.i18n({ id: 'config.inputType.float', value: 'Kommazahl' }), searchable: true, customFields: true },
        { name: 'unsignedFloat', label: this.i18n({ id: 'config.inputType.unsignedFloat', value: 'Positive Kommazahl' }), searchable: true, customFields: true },
        { name: 'dropdown', label: this.i18n({ id: 'config.inputType.dropdown', value: 'Dropdown-Liste' }), searchable: true, customFields: true },
        { name: 'dropdownRange', label: this.i18n({ id: 'config.inputType.dropdownRange', value: 'Dropdown-Liste (Bereich)' }), searchable: true, customFields: true },
        { name: 'radio', label: this.i18n({ id: 'config.inputType.radio', value: 'Radiobutton' }), searchable: true, customFields: true },
        { name: 'boolean', label: this.i18n({ id: 'config.inputType.boolean', value: 'Ja / Nein' }), searchable: true, customFields: true },
        { name: 'checkboxes', label: this.i18n({ id: 'config.inputType.checkboxes', value: 'Checkboxen' }), searchable: true, customFields: true },
        { name: 'dating', label: this.i18n({ id: 'config.inputType.dating', value: 'Datierungsangabe' }), customFields: true },
        { name: 'date', label: this.i18n({ id: 'config.inputType.date', value: 'Datum' }), customFields: true },
        { name: 'dimension', label: this.i18n({ id: 'config.inputType.dimension', value: 'Maßangabe' }), customFields: true },
        { name: 'literature', label: this.i18n({ id: 'config.inputType.literature', value: 'Literaturangabe' }), customFields: true },
        { name: 'geometry', label: this.i18n({ id: 'config.inputType.geometry', value: 'Geometrie' }) },
        { name: 'instanceOf', label: this.i18n({ id: 'config.inputType.instanceOf', value: 'Typenauswahl' }) },
        { name: 'relation', label: this.i18n({ id: 'config.inputType.relation', value: 'Relation' }) },
        { name: 'category', label: this.i18n({ id: 'config.inputType.category', value: 'Kategorie' }) }
    ];

    public saveAndReload = (configurationDocument: ConfigurationDocument, reindexCategory?: string)
        : Promise<ErrWithParams|undefined> => this.configureAppSaveChangesAndReload(
            configurationDocument, reindexCategory
        );


    constructor(private projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager,
                private datastore: Datastore,
                private messages: Messages,
                private modals: Modals,
                private settingsProvider: SettingsProvider,
                private appConfigurator: AppConfigurator,
                private configReader: ConfigReader,
                private configLoader: ConfigLoader,
                private labels: Labels,
                private indexFacade: IndexFacade,
                private menus: Menus,
                private i18n: I18n) {}


    public isShowHiddenFields = () => !this.settingsProvider.getSettings().hideHiddenFieldsInConfigurationEditor;


    async ngOnInit() {

        this.menus.setContext(MenuContext.CONFIGURATION);
        this.modals.initialize(MenuContext.CONFIGURATION);

        this.loadCategories();

        this.configurationDocument = await this.datastore.get(
            'configuration',
            { skipCache: true }
        ) as ConfigurationDocument;

        this.buildConfigurationIndex();
    }


    ngOnDestroy() {

        this.menus.setContext(MenuContext.DEFAULT);
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.CONFIGURATION) {
            await this.tabManager.openActiveTab();
        }
    }


    public onClick(event: any, rightClick: boolean = false) {

        if (!this.contextMenu.position) return;

        if (!ComponentHelpers.isInside(event.target, target => target.id === 'context-menu'
            || rightClick && target.id && (
                target.id.startsWith('choose-category-option-')
                || target.id.startsWith('category-')
                || target.id.startsWith('group-')
                || target.id.startsWith('field-')
            ))) {

            this.contextMenu.close();
        }
    }


    public performContextMenuAction(action: ConfigurationContextMenuAction) {

        this.contextMenu.close();

        switch(action) {
            case 'edit':
                if (this.contextMenu.group) {
                    this.editGroup(this.contextMenu.category, this.contextMenu.group);
                } else if (this.contextMenu.field) {
                    this.editField(this.contextMenu.category, this.contextMenu.field);
                } else {
                    this.editCategory(this.contextMenu.category);
                }
                break;
            case 'swap':
                this.swapCategoryForm(this.contextMenu.category);
                break;
            case 'delete':
                if (this.contextMenu.group) {
                    this.openDeleteGroupModal(this.contextMenu.category, this.contextMenu.group);
                } else if (this.contextMenu.field) {
                    this.openDeleteFieldModal(this.contextMenu.category, this.contextMenu.field);
                } else {
                    this.openDeleteCategoryModal(this.contextMenu.category);
                }
                break;
        }
    }


    public async setNewCategoriesOrder(newOrder: string[]) {

        const clonedConfigurationDocument = Document.clone(this.configurationDocument);
        clonedConfigurationDocument.resource.order = newOrder;

        try {
            await this.configureAppSaveChangesAndReload(clonedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            this.messages.add(errWithParams);
        }
    }


    public selectCategory(category: Category) {

        this.selectedCategory = category;
    }


    public async addSupercategory() {

        const [result, componentInstance] =
            this.modals.make<AddCategoryModalComponent>(
                AddCategoryModalComponent,
                MenuContext.CONFIGURATION_MODAL,
                'lg'
            );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.configurationIndex = this.configurationIndex;
        componentInstance.projectCategoryNames = ConfigurationUtil.getCategoriesOrder(this.topLevelCategoriesArray);
        componentInstance.initialize();

        this.modals.awaitResult(result,
            nop,
            () => AngularUtility.blurActiveElement());
    }


    public async addSubcategory(parentCategory: Category) {

        const [result, componentInstance] =
            this.modals.make<AddCategoryModalComponent>(
                AddCategoryModalComponent,
                MenuContext.CONFIGURATION_MODAL,
                'lg'
            );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.parentCategory = parentCategory;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.configurationIndex = this.configurationIndex;
        componentInstance.projectCategoryNames = ConfigurationUtil.getCategoriesOrder(this.topLevelCategoriesArray);
        componentInstance.initialize();

        this.modals.awaitResult(result,
            nop,
            () => AngularUtility.blurActiveElement());
    }


    public async editCategory(category: Category) {

        const [result, componentInstance] =
            this.modals.make<CategoryEditorModalComponent>(
                CategoryEditorModalComponent,
                MenuContext.CONFIGURATION_EDIT,
                'lg'
            );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = category;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            nop,
            () => AngularUtility.blurActiveElement());
    }


    public async editGroup(category: Category, group: Group) {

        if (group.name === Groups.PARENT || group.name === Groups.CHILD) return;

        const [result, componentInstance] =
            this.modals.make<GroupEditorModalComponent>(
                GroupEditorModalComponent,
                MenuContext.CONFIGURATION_EDIT,
                'lg'
            );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = category;
        componentInstance.group = group;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            nop,
            () => AngularUtility.blurActiveElement());
    }


    public async editField(category: Category, field: Field) {

        const [result, componentInstance] =
            this.modals.make<FieldEditorModalComponent>(
                FieldEditorModalComponent,
                MenuContext.CONFIGURATION_EDIT,
                'lg'
            );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = category;
        componentInstance.field = field;
        componentInstance.availableInputTypes = field.source === 'custom'
            ? this.availableInputTypes.filter(inputType => inputType.customFields)
            : this.availableInputTypes;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            nop,
            () => AngularUtility.blurActiveElement());
    }

    
    public swapCategoryForm(category: Category) {

        const [result, componentInstance] =
            this.modals.make<AddCategoryModalComponent>(
                AddCategoryModalComponent,
                MenuContext.CONFIGURATION_MODAL,
                'lg'
            );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.configurationIndex = this.configurationIndex;
        componentInstance.categoryToReplace = category;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            nop,
            () => AngularUtility.blurActiveElement()
        );
    }


    public async openDeleteCategoryModal(category: Category) {

        const [result, componentInstance] =
            this.modals.make<DeleteCategoryModalComponent>(
                DeleteCategoryModalComponent,
                MenuContext.CONFIGURATION_MODAL
            );

        componentInstance.category = category;
        componentInstance.labels = this.labels;
        componentInstance.customized = ConfigurationUtil.isCustomizedCategory(
            this.configurationDocument, category
        );

        this.modals.awaitResult(result,
            () => this.deleteCategory(category),
            () => AngularUtility.blurActiveElement());
    }


    public async openDeleteGroupModal(category: Category, group: Group) {

        const [result, componentInstance] =
            this.modals.make<DeleteGroupModalComponent>(
                DeleteGroupModalComponent,
                MenuContext.CONFIGURATION_MODAL
            );

        componentInstance.group = group;

        this.modals.awaitResult(result,
            () => this.deleteGroup(category, group),
            () => AngularUtility.blurActiveElement());
    }


    public async openDeleteFieldModal(category: Category, field: Field) {

        const [result, componentInstance] =
            this.modals.make<DeleteFieldModalComponent>(
                DeleteFieldModalComponent,
                MenuContext.CONFIGURATION_MODAL
            );

        componentInstance.field = field;

        this.modals.awaitResult(result,
            () => this.deleteField(category, field),
            () => AngularUtility.blurActiveElement());
    }


    private async deleteCategory(category: Category) {

        try {
            const changedConfigurationDocument: ConfigurationDocument = ConfigurationUtil.deleteCategory(
                category, this.configurationDocument
            );
            await this.configureAppSaveChangesAndReload(changedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            console.error(errWithParams);
            this.messages.add(errWithParams);
        }
    }


    private async deleteGroup(category: Category, group: Group) {

        try {
            const changedConfigurationDocument: ConfigurationDocument = ConfigurationUtil.deleteGroup(
                category,
                group,
                Tree.flatten(this.projectConfiguration.getCategories()).filter(c => c.name !== category.name),
                this.configurationDocument
            );
            await this.configureAppSaveChangesAndReload(changedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            console.error(errWithParams);
            this.messages.add(errWithParams);
        }
    }


    private async deleteField(category: Category, field: Field) {

        try {
            const changedConfigurationDocument: ConfigurationDocument = ConfigurationUtil.deleteField(
                category, field, this.configurationDocument
            );
            await this.configureAppSaveChangesAndReload(changedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            console.error(errWithParams);
            this.messages.add(errWithParams);
        }
    }


    private loadCategories() {

        this.topLevelCategoriesArray = Tree.flatten(this.projectConfiguration.getCategories())
            .filter(category => !category.parentCategory);

        if (this.selectedCategory) {
            this.selectCategory(this.projectConfiguration.getCategory(this.selectedCategory.name));
        } else {
            this.selectCategory(this.topLevelCategoriesArray[0]);
        }
    }


    private async configureAppSaveChangesAndReload(configurationDocument: ConfigurationDocument,
                                                   reindexCategory?: string): Promise<ErrWithParams|undefined> {

        const [, componentInstance] = this.modals.make<DeleteFieldModalComponent>(
            SaveModalComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        let newProjectConfiguration;
        try {
             newProjectConfiguration = await this.appConfigurator.go(
                this.settingsProvider.getSettings().username,
                getConfigurationName(this.settingsProvider.getSettings().selectedProject),
                Document.clone(configurationDocument)
            );
        } catch (errWithParams) {
            this.modals.closeModal(componentInstance);
            return errWithParams; // TODO Review. 1. Convert to msgWithParams. 2. Then basically we have the options of either return and let the children display it, or we display it directly from here, via `messages`. With the second solution the children do not need access to `messages` themselves.
        }

        try {
            try {
                this.configurationDocument = await this.datastore.update(
                    configurationDocument
                ) as ConfigurationDocument;
            } catch (errWithParams) {
                this.messages.add(MessagesConversion.convertMessage(errWithParams, this.projectConfiguration, this.labels));
                return;
            }
            this.projectConfiguration.update(newProjectConfiguration);
            if (reindexCategory) await this.reindex(this.projectConfiguration.getCategory(reindexCategory));
            if (!this.projectConfiguration.getCategory(this.selectedCategory.name)) {
                this.selectedCategory = undefined;
            }
            this.loadCategories();
        } catch (e) {
            console.error('error in configureAppSaveChangesAndReload', e);
        }

        this.modals.closeModal(componentInstance);
    }


    private async reindex(category: Category) {

        Category.getFields(category).forEach(field => {
            this.indexFacade.addConstraintIndexDefinitionsForField(field)
        });

        const documents: Array<Document> = (await this.datastore.find(
            { categories: [category.name] }
        )).documents

        await this.indexFacade.putMultiple(documents);
    }


    private async buildConfigurationIndex() {

        try {
            const builtInConfiguration = new BuiltInConfiguration('');
            const libraryCategories = await this.configReader.read('/Library/Categories.json');
            const valuelists = await this.configReader.read('/Library/Valuelists.json');
            const languages = await this.configLoader.readDefaultLanguageConfigurations();

            const categories = createContextIndependentCategories(
                builtInConfiguration.builtInCategories,
                builtInConfiguration.builtInRelations,
                libraryCategories,
                builtInConfiguration.commonFields,
                builtInConfiguration.builtInFields,
                valuelists,
                this.topLevelCategoriesArray.map(to('libraryId')),
                languages
            );

            this.configurationIndex = ConfigurationIndex.create(categories);

        } catch (e) {
            console.error('error while reading config in AddCategoryModalComponent', e);
        }
    }
}

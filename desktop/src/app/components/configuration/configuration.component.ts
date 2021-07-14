import { Component, OnInit } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Category, Datastore, ConfigurationDocument, ProjectConfiguration, Document, AppConfigurator,
    getConfigurationName, FieldDefinition, Group, Groups, BuiltInConfiguration, ConfigReader, ConfigLoader } from 'idai-field-core';
import { TabManager } from '../../core/tabs/tab-manager';
import { MenuContext } from '../services/menu-context';
import { Messages } from '../messages/messages';
import { SettingsProvider } from '../../core/settings/settings-provider';
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
import { Modals } from '../services/modals';
import {nop} from 'tsfun';
import {ConfigurationIndex} from '../../core/configuration/configuration-index';


export type InputType = {
    name: string;
    label: string;
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
export class ConfigurationComponent implements OnInit {

    public topLevelCategoriesArray: Array<Category>;
    public selectedCategory: Category;
    public configurationDocument: ConfigurationDocument;
    public saving: boolean = false;
    public showHiddenFields: boolean = true;
    public allowDragAndDrop: boolean = true;
    public contextMenu: ConfigurationContextMenu = new ConfigurationContextMenu();
    private configurationIndex: ConfigurationIndex = {};

    public availableInputTypes: Array<InputType> = [
        { name: 'input', label: this.i18n({ id: 'config.inputType.input', value: 'Einzeiliger Text' }) },
        { name: 'multiInput', label: this.i18n({ id: 'config.inputType.multiInput', value: 'Einzeiliger Text mit Mehrfachauswahl' }) },
        { name: 'text', label: this.i18n({ id: 'config.inputType.text', value: 'Mehrzeiliger Text' }) },
        { name: 'unsignedInt', label: this.i18n({ id: 'config.inputType.unsignedInt', value: 'Positive Ganzzahl' }) },
        { name: 'float', label: this.i18n({ id: 'config.inputType.float', value: 'Kommazahl' }) },
        { name: 'unsignedFloat', label: this.i18n({ id: 'config.inputType.unsignedFloat', value: 'Positive Kommazahl' }) },
        { name: 'dropdown', label: this.i18n({ id: 'config.inputType.dropdown', value: 'Dropdown-Liste' }) },
        { name: 'dropdownRange', label: this.i18n({ id: 'config.inputType.dropdownRange', value: 'Dropdown-Liste (Bereich)' }) },
        { name: 'radio', label: this.i18n({ id: 'config.inputType.radio', value: 'Radiobutton' }) },
        { name: 'boolean', label: this.i18n({ id: 'config.inputType.boolean', value: 'Ja / Nein' }) },
        { name: 'checkboxes', label: this.i18n({ id: 'config.inputType.checkboxes', value: 'Checkboxen' }) },
        { name: 'dating', label: this.i18n({ id: 'config.inputType.dating', value: 'Datierungsangabe' }) },
        { name: 'date', label: this.i18n({ id: 'config.inputType.date', value: 'Datum' }) },
        { name: 'dimension', label: this.i18n({ id: 'config.inputType.dimension', value: 'Maßangabe' }) },
        { name: 'literature', label: this.i18n({ id: 'config.inputType.literature', value: 'Literaturangabe' }) },
        { name: 'geometry', label: this.i18n({ id: 'config.inputType.geometry', value: 'Geometrie' }) },
        { name: 'instanceOf', label: this.i18n({ id: 'config.inputType.instanceOf', value: 'Typenauswahl' }) },
        { name: 'relation', label: this.i18n({ id: 'config.inputType.relation', value: 'Relation' }) },
        { name: 'category', label: this.i18n({ id: 'config.inputType.category', value: 'Kategorie' }) }
    ];

    public saveAndReload = (configurationDocument: ConfigurationDocument)
        : Promise<ErrWithParams|undefined> => this.configureAppSaveChangesAndReload(configurationDocument);


    constructor(private projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager,
                private datastore: Datastore,
                private messages: Messages,
                private modals: Modals,
                private settingsProvider: SettingsProvider,
                private appConfigurator: AppConfigurator,
                private configReader: ConfigReader,
                private configLoader: ConfigLoader,
                private i18n: I18n) {}


    async ngOnInit() {

        this.loadCategories();

        this.configurationDocument = await this.datastore.get(
            'configuration',
            { skipCache: true }
        ) as ConfigurationDocument;

        this.buildConfigurationIndex();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.modals.getMenuContext() === MenuContext.DEFAULT) {
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


    public async addSubcategory(parentCategory: Category) {

        const [result, componentInstance] =
            this.modals.make<AddCategoryModalComponent>(
                AddCategoryModalComponent,
                MenuContext.MODAL,
                'lg'
            );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.parentCategory = parentCategory;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.configurationIndex = this.configurationIndex;
        componentInstance.init();

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


    public async editField(category: Category, field: FieldDefinition) {

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
        componentInstance.availableInputTypes = this.availableInputTypes;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            nop,
            () => AngularUtility.blurActiveElement());
    }


    public async openDeleteCategoryModal(category: Category) {

        const [result, componentInstance] =
            this.modals.make<DeleteCategoryModalComponent>(
                DeleteCategoryModalComponent,
                MenuContext.MODAL
            );

        componentInstance.category = category;

        this.modals.awaitResult(result,
            () => this.deleteCategory(category),
            () => AngularUtility.blurActiveElement());
    }


    public async openDeleteGroupModal(category: Category, group: Group) {

        this.modals.setMenuContext(MenuContext.MODAL);

        const [result, componentInstance] =
            this.modals.make<DeleteGroupModalComponent>(
                DeleteGroupModalComponent,
                MenuContext.MODAL
            );

        componentInstance.group = group;

        this.modals.awaitResult(result,
            () => this.deleteGroup(category, group),
            () => AngularUtility.blurActiveElement());
    }


    public async openDeleteFieldModal(category: Category, field: FieldDefinition) {

        const [result, componentInstance] =
            this.modals.make<DeleteFieldModalComponent>(
                DeleteFieldModalComponent,
                MenuContext.MODAL
            );

        componentInstance.field = field;

        this.modals.awaitResult(result,
            () => this.deleteField(category, field),
            () => AngularUtility.blurActiveElement());
    }


    private async deleteCategory(category: Category) {

        const changedConfigurationDocument: ConfigurationDocument = ConfigurationUtil.deleteCategory(
            category, this.configurationDocument
        );

        try {
            await this.configureAppSaveChangesAndReload(changedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            this.messages.add(errWithParams);
        }
    }


    private async deleteGroup(category: Category, group: Group) {

        const changedConfigurationDocument: ConfigurationDocument = ConfigurationUtil.deleteGroup(
            category, group, this.configurationDocument
        );

        try {
            await this.configureAppSaveChangesAndReload(changedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            this.messages.add(errWithParams);
        }
    }


    private async deleteField(category: Category, field: FieldDefinition) {

        const changedConfigurationDocument: ConfigurationDocument = ConfigurationUtil.deleteField(
            category, field, this.configurationDocument
        );

        try {
            await this.configureAppSaveChangesAndReload(changedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            this.messages.add(errWithParams);
        }
    }


    private loadCategories() {

        this.topLevelCategoriesArray = this.projectConfiguration.getCategoriesArray()
            .filter(category => !category.parentCategory);

        if (this.selectedCategory) {
            this.selectCategory(this.projectConfiguration.getCategory(this.selectedCategory.name));
        } else {
            this.selectCategory(this.topLevelCategoriesArray[0]);
        }
    }


    private async configureAppSaveChangesAndReload(configurationDocument: ConfigurationDocument)
            : Promise<ErrWithParams|undefined> {

        let newProjectConfiguration;
        try {
             newProjectConfiguration = await this.appConfigurator.go(
                this.settingsProvider.getSettings().username,
                getConfigurationName(this.settingsProvider.getSettings().selectedProject),
                Document.clone(configurationDocument)
            );
        } catch (errWithParams) {
            return errWithParams; // TODO Review. 1. Convert to msgWithParams. 2. Then basically we have the options of either return and let the children display it, or we display it directly from here, via `messages`. With the second solution the children do not need access to `messages` themselves.
        }

        try {
            try {
                this.configurationDocument = await this.datastore.update(
                    configurationDocument,
                    this.settingsProvider.getSettings().username
                ) as ConfigurationDocument;
            } catch (errWithParams) {
                this.messages.add(MessagesConversion.convertMessage(errWithParams, this.projectConfiguration));
                return;
            }
            this.projectConfiguration.update(newProjectConfiguration);
            if (!this.projectConfiguration.getCategory(this.selectedCategory.name)) {
                this.selectedCategory = undefined;
            }
            this.loadCategories();
        } catch (e) {
            console.error('error in configureAppSaveChangesAndReload', e);
        }
    }


    private async buildConfigurationIndex() {

        try {
            const builtInConfiguration = new BuiltInConfiguration('');
            const config = await this.configReader.read('/Library/Categories.json');
            const languages = await this.configLoader.readDefaultLanguageConfigurations();
            this.configurationIndex = ConfigurationIndex.create(
                builtInConfiguration.builtInCategories,
                builtInConfiguration.builtInRelations,
                config,
                languages);

        } catch (e) {
            console.error('error while reading config in AddCategoryModalComponent', e);
        }
    }
}

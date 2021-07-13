import { Component, OnInit } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Category, Datastore, ConfigurationDocument, ProjectConfiguration, Document, AppConfigurator,
    getConfigurationName, FieldDefinition, Group, Groups } from 'idai-field-core';
import { TabManager } from '../../core/tabs/tab-manager';
import { MenuContext, MenuService } from '../menu-service';
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
import { LinkLibraryCategoryModalComponent } from './add/link-library-category-modal.component';
import { ErrWithParams } from '../../core/import/import/import-documents';
import { DeleteCategoryModalComponent } from './delete/delete-category-modal.component';


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
    public customConfigurationDocument: ConfigurationDocument;
    public saving: boolean = false;
    public showHiddenFields: boolean = true;
    public allowDragAndDrop: boolean = true;
    public contextMenu: ConfigurationContextMenu = new ConfigurationContextMenu();

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
                private menuService: MenuService,
                private datastore: Datastore,
                private messages: Messages,
                private settingsProvider: SettingsProvider,
                private modalService: NgbModal,
                private appConfigurator: AppConfigurator,
                private i18n: I18n) {}


    async ngOnInit() {

        this.loadCategories();

        this.customConfigurationDocument = await this.datastore.get(
            'configuration',
            { skipCache: true }
        ) as ConfigurationDocument;
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
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

        const clonedConfigurationDocument = Document.clone(this.customConfigurationDocument);
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

        this.menuService.setContext(MenuContext.MODAL);

        const modalReference: NgbModalRef = this.modalService.open(
            LinkLibraryCategoryModalComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        modalReference.componentInstance.configureAppSaveChangesAndReload = this.saveAndReload
        modalReference.componentInstance.parentCategory = parentCategory;
        modalReference.componentInstance.customConfigurationDocument = this.customConfigurationDocument;

        try {
            await modalReference.result;
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    public async editCategory(category: Category) {

        this.menuService.setContext(MenuContext.CONFIGURATION_EDIT);

        const modalReference: NgbModalRef = this.modalService.open(
            CategoryEditorModalComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        modalReference.componentInstance.saveAndReload = this.saveAndReload
        modalReference.componentInstance.customConfigurationDocument = this.customConfigurationDocument;
        modalReference.componentInstance.category = category;
        modalReference.componentInstance.initialize();

        try {
            await modalReference.result;
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    public async editGroup(category: Category, group: Group) {

        if (group.name === Groups.PARENT || group.name === Groups.CHILD) return;

        this.menuService.setContext(MenuContext.CONFIGURATION_EDIT);

        const modalReference: NgbModalRef = this.modalService.open(
            GroupEditorModalComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );

        modalReference.componentInstance.saveAndReload = this.saveAndReload
        modalReference.componentInstance.customConfigurationDocument = this.customConfigurationDocument;
        modalReference.componentInstance.category = category;
        modalReference.componentInstance.group = group;
        modalReference.componentInstance.initialize();

        try {
            await modalReference.result;
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    public async editField(category: Category, field: FieldDefinition) {

        this.menuService.setContext(MenuContext.CONFIGURATION_EDIT);

        const modalReference: NgbModalRef = this.modalService.open(
            FieldEditorModalComponent,
            { size: 'lg', backdrop: 'static', keyboard: false }
        );
        modalReference.componentInstance.saveAndReload = this.saveAndReload;
        modalReference.componentInstance.customConfigurationDocument = this.customConfigurationDocument;
        modalReference.componentInstance.category = category;
        modalReference.componentInstance.field = field;
        modalReference.componentInstance.availableInputTypes = this.availableInputTypes;
        modalReference.componentInstance.initialize();

        try {
            await modalReference.result
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    public async openDeleteCategoryModal(category: Category) {

        this.menuService.setContext(MenuContext.MODAL);

        const modalReference: NgbModalRef = this.modalService.open(
            DeleteCategoryModalComponent,
            { backdrop: 'static', keyboard: false }
        );
        modalReference.componentInstance.category = category;

        try {
            await modalReference.result;
            await this.deleteCategory(category);
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    public async openDeleteGroupModal(category: Category, group: Group) {

        this.menuService.setContext(MenuContext.MODAL);

        const modalReference: NgbModalRef = this.modalService.open(
            DeleteGroupModalComponent,
            { backdrop: 'static', keyboard: false }
        );
        modalReference.componentInstance.group = group;

        try {
            await modalReference.result;
            await this.deleteGroup(category, group);
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    public async openDeleteFieldModal(category: Category, field: FieldDefinition) {

        this.menuService.setContext(MenuContext.MODAL);

        const modalReference: NgbModalRef = this.modalService.open(
            DeleteFieldModalComponent,
            { backdrop: 'static', keyboard: false }
        );
        modalReference.componentInstance.field = field;

        try {
            await modalReference.result;
            await this.deleteField(category, field);
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
            AngularUtility.blurActiveElement();
        }
    }


    private async deleteCategory(category: Category) {

        const changedConfigurationDocument: ConfigurationDocument = ConfigurationUtil.deleteCategory(
            category, this.customConfigurationDocument
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
            category, group, this.customConfigurationDocument
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
            category, field, this.customConfigurationDocument
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
                this.customConfigurationDocument = await this.datastore.update(
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
}

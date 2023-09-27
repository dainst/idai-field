import { Component, OnDestroy, OnInit } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { nop } from 'tsfun';
import { CategoryForm, Datastore, ConfigurationDocument, ProjectConfiguration, Document, AppConfigurator,
    getConfigurationName, Field, Group, Labels, IndexFacade, Tree, InPlace, ConfigReader, Indexer,
    DocumentConverter, DocumentCache, PouchdbDatastore } from 'idai-field-core';
import { TabManager } from '../../services/tabs/tab-manager';
import { Messages } from '../messages/messages';
import { MessagesConversion } from '../docedit/messages-conversion';
import { CategoryEditorModalComponent } from './editor/category/category-editor-modal.component';
import { AngularUtility } from '../../angular/angular-utility';
import { FieldEditorModalComponent } from './editor/field/field-editor-modal.component';
import { GroupEditorModalComponent } from './editor/group/group-editor-modal.component';
import { ConfigurationContextMenu } from './context-menu/configuration-context-menu';
import { ConfigurationContextMenuAction } from './context-menu/configuration-context-menu.component';
import { ComponentHelpers } from '../component-helpers';
import { DeleteFieldModalComponent } from './delete/delete-field-modal.component';
import { CategoriesFilter, ConfigurationUtil, InputType } from '../../components/configuration/configuration-util';
import { DeleteGroupModalComponent } from './delete/delete-group-modal.component';
import { AddCategoryFormModalComponent } from './add/category/add-category-form-modal.component';
import { DeleteCategoryModalComponent } from './delete/delete-category-modal.component';
import { ConfigurationIndex } from '../../services/configuration/index/configuration-index';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { Modals } from '../../services/modals';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';
import { MenuNavigator } from '../menu-navigator';
import { ManageValuelistsModalComponent } from './add/valuelist/manage-valuelists-modal.component';
import { OrderChange } from '../widgets/category-picker.component';
import { SaveProcessModalComponent } from './save/save-process-modal.component';
import { SaveModalComponent } from './save/save-modal.component';
import { EditSaveDialogComponent } from '../widgets/edit-save-dialog.component';
import { ConfigurationState } from './configuration-state';
import { ImportConfigurationModalComponent } from './import/import-configuration-modal.component';
import { ProjectLanguagesModalComponent } from './languages/project-languages-modal.component';


@Component({
    templateUrl: './configuration.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
        '(window:click)': 'onClick($event, false)',
        '(window:contextmenu)': 'onClick($event, true)'
    }
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ConfigurationComponent implements OnInit, OnDestroy {

    public topLevelCategoriesArray: Array<CategoryForm>;
    public filteredTopLevelCategoriesArray: Array<CategoryForm>;
    public selectedCategory: CategoryForm;
    public selectedCategoriesFilter: CategoriesFilter;
    public configurationDocument: ConfigurationDocument;
    public contextMenu: ConfigurationContextMenu = new ConfigurationContextMenu();
    public clonedProjectConfiguration: ProjectConfiguration;
    
    public ready: boolean = false;
    public dragging: boolean = false;
    public changed: boolean = false;
    public escapeKeyPressed: boolean = false;

    public categoriesFilterOptions: Array<CategoriesFilter> = [
        { name: 'all', label: this.i18n({ id: 'configuration.categoriesFilter.all', value: 'Alle' }) },
        { name: 'project', label: this.i18n({ id: 'configuration.categoriesFilter.project', value: 'Projekt' }) },
        { name: 'trench', isRecordedInCategory: 'Trench', label: this.i18n({ id: 'configuration.categoriesFilter.trench', value: 'Schnitt' }) },
        { name: 'building', isRecordedInCategory: 'Building', label: this.i18n({ id: 'configuration.categoriesFilter.building', value: 'Bauwerk' }) },
        { name: 'survey', isRecordedInCategory: 'Survey', label: this.i18n({ id: 'configuration.categoriesFilter.survey', value: 'Survey' }) },
        { name: 'images', label: this.i18n({ id: 'configuration.categoriesFilter.images', value: 'Bilderverwaltung' }) },
        { name: 'types', label: this.i18n({ id: 'configuration.categoriesFilter.types', value: 'Typenverwaltung' }) }
    ];

    public availableInputTypes: Array<InputType> = [
        { name: 'input', label: this.i18n({ id: 'config.inputType.input', value: 'Einzeiliger Text' }), searchable: true, customFields: true },
        { name: 'simpleInput', label: this.i18n({ id: 'config.inputType.input', value: 'Einzeiliger Text' }), searchable: true, customFields: true },
        { name: 'multiInput', label: this.i18n({ id: 'config.inputType.multiInput', value: 'Einzeiliger Text mit Mehrfachauswahl' }), searchable: true, customFields: true },
        { name: 'simpleMultiInput', label: this.i18n({ id: 'config.inputType.multiInput', value: 'Einzeiliger Text mit Mehrfachauswahl' }), searchable: true, customFields: true },
        { name: 'text', label: this.i18n({ id: 'config.inputType.text', value: 'Mehrzeiliger Text' }), searchable: true, customFields: true },
        { name: 'int', label: this.i18n({ id: 'config.inputType.int', value: 'Ganzzahl' }), searchable: true, customFields: true },
        { name: 'unsignedInt', label: this.i18n({ id: 'config.inputType.unsignedInt', value: 'Positive Ganzzahl' }), searchable: true, customFields: true },
        { name: 'float', label: this.i18n({ id: 'config.inputType.float', value: 'Kommazahl' }), searchable: true, customFields: true },
        { name: 'unsignedFloat', label: this.i18n({ id: 'config.inputType.unsignedFloat', value: 'Positive Kommazahl' }), searchable: true, customFields: true },
        { name: 'url', label: this.i18n({ id: 'config.inputType.url', value: 'URL' }), searchable: true, customFields: true },
        { name: 'dropdown', label: this.i18n({ id: 'config.inputType.dropdown', value: 'Dropdown-Liste' }), searchable: true, customFields: true },
        { name: 'dropdownRange', label: this.i18n({ id: 'config.inputType.dropdownRange', value: 'Dropdown-Liste (Bereich)' }), searchable: true, customFields: true },
        { name: 'radio', label: this.i18n({ id: 'config.inputType.radio', value: 'Radiobutton' }), searchable: true, customFields: true },
        { name: 'boolean', label: this.i18n({ id: 'config.inputType.boolean', value: 'Ja / Nein' }), searchable: true, customFields: true },
        { name: 'checkboxes', label: this.i18n({ id: 'config.inputType.checkboxes', value: 'Checkboxen' }), searchable: true, customFields: true },
        { name: 'dating', label: this.i18n({ id: 'config.inputType.dating', value: 'Datierungsangabe' }), customFields: true },
        { name: 'date', label: this.i18n({ id: 'config.inputType.date', value: 'Datum' }), customFields: true },
        { name: 'dimension', label: this.i18n({ id: 'config.inputType.dimension', value: 'Maßangabe' }), customFields: true },
        { name: 'literature', label: this.i18n({ id: 'config.inputType.literature', value: 'Literaturangabe' }), customFields: true },
        { name: 'composite', label: this.i18n({ id: 'config.inputType.composite', value: 'Kompositfeld' }), customFields: true },
        { name: 'geometry', label: this.i18n({ id: 'config.inputType.geometry', value: 'Geometrie' }) },
        { name: 'instanceOf', label: this.i18n({ id: 'config.inputType.instanceOf', value: 'Typenauswahl' }) },
        { name: 'relation', label: this.i18n({ id: 'config.inputType.relation', value: 'Relation' }) },
        { name: 'category', label: this.i18n({ id: 'config.inputType.category', value: 'Kategorie' }) },
        { name: 'identifier', label: this.i18n({ id: 'config.inputType.identifier', value: 'Bezeichner' }) }
    ];

    public applyChanges = (configurationDocument: ConfigurationDocument,
                           reindexConfiguration?: boolean): Promise<void> =>
        this.updateProjectConfiguration(configurationDocument, reindexConfiguration);

    private menuSubscription: Subscription;


    constructor(private projectConfiguration: ProjectConfiguration,
                private tabManager: TabManager,
                private datastore: Datastore,
                private messages: Messages,
                private modals: Modals,
                private settingsProvider: SettingsProvider,
                private appConfigurator: AppConfigurator,
                private configurationIndex: ConfigurationIndex,
                private configReader: ConfigReader,
                private labels: Labels,
                private indexFacade: IndexFacade,
                private menus: Menus,
                private menuNavigator: MenuNavigator,
                private modalService: NgbModal,
                private documentCache: DocumentCache,
                private documentConverter: DocumentConverter,
                private pouchdbDatastore: PouchdbDatastore,
                private configurationState: ConfigurationState,
                private i18n: I18n) {}


    public isShowHiddenFields = () => !this.settingsProvider.getSettings().hideHiddenFieldsInConfigurationEditor;

    public isHighlightCustomElements = () => this.settingsProvider.getSettings().highlightCustomElements;

    public isCategoryConfigured = (categoryName: string) =>
        this.clonedProjectConfiguration.getCategory(categoryName) !== undefined;


    async ngOnInit() {

        this.menus.setContext(MenuContext.CONFIGURATION);
        this.modals.initialize(MenuContext.CONFIGURATION);

        this.configurationDocument = await this.fetchConfigurationDocument();
        this.clonedProjectConfiguration = await this.buildProjectConfiguration(this.configurationDocument);

        await this.configurationState.load();
        await this.loadCategories(
            this.configurationState.getSelectedCategoriesFilterName(),
            this.configurationState.getSelectedCategoryName()
        );

        this.menuSubscription = this.menuNavigator.configurationMenuNotifications()
            .subscribe(menuItem => this.onMenuItemClicked(menuItem));

        this.ready = true;
    }


    ngOnDestroy() {

        this.menus.setContext(MenuContext.DEFAULT);
        if (this.menuSubscription) this.menuSubscription.unsubscribe();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 's' && this.menus.getContext() === MenuContext.CONFIGURATION
                && (event.ctrlKey || event.metaKey) && !event.altKey) {
            await this.openSaveModal();
        }

        if (event.key !== 'Escape') return;

        if (!this.escapeKeyPressed && this.menus.getContext() === MenuContext.CONFIGURATION) {
            await this.tabManager.openActiveTab();
        } else {
            this.escapeKeyPressed = true;
        }
    }


    public async onKeyUp(event: KeyboardEvent) {

        if (event.key === 'Escape') this.escapeKeyPressed = false;
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


    public async onMenuItemClicked(menuItem: string) {

        switch (menuItem) {
            case 'projectLanguages':
                this.openProjectLanguagesModal();
                break;
            case 'valuelists':
                await AngularUtility.refresh();
                this.openValuelistsManagementModal();
                break;
            case 'importConfiguration':
                this.openImportConfigurationModal();
                break;
        }
    }


    public async setCategoriesFilter(filter: CategoriesFilter, selectFirstCategory: boolean = true) {

        this.selectedCategoriesFilter = filter;
        this.filteredTopLevelCategoriesArray = ConfigurationUtil.filterTopLevelCategories(
            this.topLevelCategoriesArray, this.selectedCategoriesFilter, this.clonedProjectConfiguration
        );
        await this.configurationState.setSelectedCategoriesFilterName(filter.name);

        if (selectFirstCategory) this.selectCategory(this.filteredTopLevelCategoriesArray[0]);
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


    public async applyOrderChange(orderChange: OrderChange) {

        if (orderChange.parentCategory) {
            InPlace.moveInArray(
                this.topLevelCategoriesArray
                    .find(category => category.name === orderChange.parentCategory.name)
                    .children,
                    orderChange.previousIndex,
                orderChange.currentIndex
            );
        } else {
            const previousIndex: number = this.topLevelCategoriesArray.indexOf(
                this.filteredTopLevelCategoriesArray[orderChange.previousIndex]
            );
            const currentIndex: number = (orderChange.currentIndex === 0)
                ? this.topLevelCategoriesArray.indexOf(this.filteredTopLevelCategoriesArray[0])
                : this.topLevelCategoriesArray.indexOf(this.filteredTopLevelCategoriesArray[orderChange.currentIndex - 1]) + 1;

            InPlace.moveInArray(
                this.topLevelCategoriesArray,
                previousIndex,
                currentIndex
            );
        }

        const clonedConfigurationDocument = Document.clone(this.configurationDocument);
        clonedConfigurationDocument.resource.order = ConfigurationUtil.getCategoriesOrder(
            this.topLevelCategoriesArray
        );

        try {
            await this.updateProjectConfiguration(clonedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            this.messages.add(errWithParams);
        }
    }


    public selectCategory(category: CategoryForm) {

        this.selectedCategory = this.clonedProjectConfiguration.getCategory(category.name);
        this.configurationState.setSelectedCategoryName(this.selectedCategory.name);
    }


    public async addSupercategory() {

        const [result, componentInstance] = this.modals.make<AddCategoryFormModalComponent>(
            AddCategoryFormModalComponent,
            MenuContext.CONFIGURATION_MANAGEMENT,
            'lg'
        );

        componentInstance.applyChanges = this.applyChanges;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.clonedProjectConfiguration = this.clonedProjectConfiguration;
        componentInstance.projectCategoryNames = ConfigurationUtil.getCategoriesOrder(this.topLevelCategoriesArray);
        componentInstance.categoriesFilter = this.selectedCategoriesFilter;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            (newCategory) => this.selectCategory(newCategory),
            () => AngularUtility.blurActiveElement()
        );
    }


    public async addSubcategory(parentCategory: CategoryForm) {

        const [result, componentInstance] = this.modals.make<AddCategoryFormModalComponent>(
            AddCategoryFormModalComponent,
            MenuContext.CONFIGURATION_MANAGEMENT,
            'lg'
        );

        componentInstance.applyChanges = this.applyChanges;
        componentInstance.parentCategory = parentCategory;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.clonedProjectConfiguration = this.clonedProjectConfiguration;
        componentInstance.projectCategoryNames = ConfigurationUtil.getCategoriesOrder(this.topLevelCategoriesArray);
        componentInstance.initialize();

        this.modals.awaitResult(result,
            (newCategory) => this.selectCategory(newCategory),
            () => AngularUtility.blurActiveElement()
        );
    }


    public async editCategory(category: CategoryForm) {

        const [result, componentInstance] = this.modals.make<CategoryEditorModalComponent>(
            CategoryEditorModalComponent,
            MenuContext.CONFIGURATION_EDIT,
            'lg'
        );

        componentInstance.applyChanges = this.applyChanges;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = category;
        componentInstance.numberOfCategoryResources = await this.datastore.findIds({ categories: [category.name] }).totalCount;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            () => this.selectCategory(category),
            () => AngularUtility.blurActiveElement()
        );
    }


    public async editGroup(category: CategoryForm, group: Group) {

        const [result, componentInstance] = this.modals.make<GroupEditorModalComponent>(
            GroupEditorModalComponent,
            MenuContext.CONFIGURATION_EDIT,
            'lg'
        );

        componentInstance.applyChanges = this.applyChanges;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = category;
        componentInstance.group = group;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            nop,
            () => AngularUtility.blurActiveElement()
        );
    }


    public async editField(category: CategoryForm, field: Field) {

        const [result, componentInstance] = this.modals.make<FieldEditorModalComponent>(
            FieldEditorModalComponent,
            MenuContext.CONFIGURATION_EDIT,
            'lg'
        );

        componentInstance.applyChanges = this.applyChanges;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = category;
        componentInstance.field = field;
        componentInstance.availableInputTypes = field.source === 'custom'
            ? this.availableInputTypes.filter(inputType => inputType.customFields)
            : this.availableInputTypes;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            nop,
            () => AngularUtility.blurActiveElement()
        );
    }


    public swapCategoryForm(category: CategoryForm) {

        const [result, componentInstance] = this.modals.make<AddCategoryFormModalComponent>(
            AddCategoryFormModalComponent,
            MenuContext.CONFIGURATION_MANAGEMENT,
            'lg'
        );

        componentInstance.applyChanges = this.applyChanges;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.clonedProjectConfiguration = this.clonedProjectConfiguration;
        componentInstance.categoryFormToReplace = category;
        componentInstance.initialize();

        this.modals.awaitResult(result,
            () => this.selectCategory(category),
            () => AngularUtility.blurActiveElement()
        );
    }


    public async openDeleteCategoryModal(category: CategoryForm) {

        const [result, componentInstance] = this.modals.make<DeleteCategoryModalComponent>(
            DeleteCategoryModalComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        componentInstance.category = category;
        componentInstance.labels = this.labels;
        componentInstance.customized = ConfigurationDocument.isCustomizedCategory(
            this.configurationDocument, category
        );
        componentInstance.resourceCount = (await this.datastore.findIds({ categories: [category.name] })).ids.length;

        this.modals.awaitResult(result,
            () => this.deleteCategory(category),
            () => AngularUtility.blurActiveElement()
        );
    }


    public async openDeleteGroupModal(category: CategoryForm, group: Group) {

        const [result, componentInstance] = this.modals.make<DeleteGroupModalComponent>(
            DeleteGroupModalComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        componentInstance.group = group;

        this.modals.awaitResult(result,
            () => this.deleteGroup(category, group),
            () => AngularUtility.blurActiveElement()
        );
    }


    public async openDeleteFieldModal(category: CategoryForm, field: Field) {

        const [result, componentInstance] = this.modals.make<DeleteFieldModalComponent>(
            DeleteFieldModalComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        componentInstance.field = field;

        this.modals.awaitResult(result,
            () => this.deleteField(category, field),
            () => AngularUtility.blurActiveElement()
        );
    }


    public async openSaveModal(): Promise<boolean> {

        this.menus.setContext(MenuContext.CONFIGURATION_MODAL);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                SaveModalComponent, { keyboard: false, animation: false }
            );
            
            await modalRef.result;
            await this.save();
            return true;
        } catch (_) {
            return false;
        } finally {
            this.menus.setContext(MenuContext.CONFIGURATION);
        }
    }


    public async openDiscardChangesModal(): Promise<boolean> {

        this.menus.setContext(MenuContext.CONFIGURATION_MODAL);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                EditSaveDialogComponent, { keyboard: false, animation: false }
            );
            modalRef.componentInstance.changeMessage = this.i18n({
                id: 'configuration.changes', value: 'An der Konfiguration wurden Änderungen vorgenommen.'
            });
            modalRef.componentInstance.escapeKeyPressed = this.escapeKeyPressed;

            const result: string = await modalRef.result;

            if (result === 'save') {
                AngularUtility.blurActiveElement();
                return await this.openSaveModal();
            } else if (result === 'discard') {
                await this.discardChanges();
                return true;
            }
        } catch (_) {
            return false;
        } finally {
            this.menus.setContext(MenuContext.CONFIGURATION);
        }
    }


    private async deleteCategory(category: CategoryForm) {

        try {
            const changedConfigurationDocument: ConfigurationDocument = ConfigurationDocument.deleteCategory(
                this.configurationDocument, category
            );
            await this.updateProjectConfiguration(changedConfigurationDocument, true);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            console.error(errWithParams);
            this.messages.add(errWithParams);
        }
    }


    private async deleteGroup(category: CategoryForm, group: Group) {

        try {
            const changedConfigurationDocument: ConfigurationDocument = ConfigurationDocument.deleteGroup(
                this.configurationDocument,
                category,
                group,
                Tree.flatten(this.clonedProjectConfiguration.getCategories()).filter(c => c.name !== category.name),
            );
            await this.updateProjectConfiguration(changedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            console.error(errWithParams);
            this.messages.add(errWithParams);
        }
    }


    private async deleteField(category: CategoryForm, field: Field) {

        try {
            const changedConfigurationDocument: ConfigurationDocument = ConfigurationDocument.deleteField(
                this.configurationDocument, category, field
            );
            await this.updateProjectConfiguration(changedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            console.error(errWithParams);
            this.messages.add(errWithParams);
        }
    }


    private async openProjectLanguagesModal() {

        const [result, componentInstance] = this.modals.make<ProjectLanguagesModalComponent>(
            ProjectLanguagesModalComponent,
            MenuContext.CONFIGURATION_MANAGEMENT
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(result, nop, nop);
    }


    private async openValuelistsManagementModal() {

        const [result, componentInstance] = this.modals.make<ManageValuelistsModalComponent>(
            ManageValuelistsModalComponent,
            MenuContext.CONFIGURATION_MANAGEMENT,
            'lg'
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(result, nop, nop);
    }


    private async openImportConfigurationModal() {

        const [result, componentInstance] = this.modals.make<ImportConfigurationModalComponent>(
            ImportConfigurationModalComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.applyChanges = this.applyChanges;

        await this.modals.awaitResult(result, nop, nop);
    }


    private async loadCategories(selectedCategoriesFilterName?: string, selectedCategoryName?: string) {

        this.topLevelCategoriesArray = Tree.flatten(this.clonedProjectConfiguration.getCategories())
            .filter(category => !category.parentCategory);

        if (this.selectedCategory) {
            this.selectCategory(this.clonedProjectConfiguration.getCategory(this.selectedCategory.name));
        } else if (selectedCategoryName) {
            this.selectCategory(this.clonedProjectConfiguration.getCategory(selectedCategoryName));
        }

        await this.setCategoriesFilter(
            this.selectedCategoriesFilter ?? this.categoriesFilterOptions.find(filter => {
                return filter.name === (selectedCategoriesFilterName ?? 'project');
            }),
            this.selectedCategory === undefined
        );
    }


    private async updateProjectConfiguration(configurationDocument: ConfigurationDocument,
                                             reindexConfiguration?: boolean): Promise<void> {

        this.clonedProjectConfiguration = await this.buildProjectConfiguration(configurationDocument);
        this.configurationDocument.resource = configurationDocument.resource;
        if (reindexConfiguration) {
            await this.configurationIndex.rebuild(this.configurationDocument, this.clonedProjectConfiguration);
        }
        if (!this.clonedProjectConfiguration.getCategory(this.selectedCategory.name)) {
            this.selectedCategory = undefined;
        }
        await this.loadCategories();

        this.changed = true;
    }


    private buildProjectConfiguration(configurationDocument: ConfigurationDocument): Promise<ProjectConfiguration> {

        try {
            return this.appConfigurator.go(
               getConfigurationName(this.settingsProvider.getSettings().selectedProject),
               Document.clone(configurationDocument)
           );
       } catch (errWithParams) {
           throw errWithParams; // TODO Review. 1. Convert to msgWithParams. 2. Then basically we have the options of either return and let the children display it, or we display it directly from here, via `messages`. With the second solution the children do not need access to `messages` themselves.
       }
    }


    private async save() {

        const [, componentInstance] = this.modals.make<SaveProcessModalComponent>(
            SaveProcessModalComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        try {
            this.configurationDocument = this.configurationDocument._rev
                ? await this.datastore.update(this.configurationDocument) as ConfigurationDocument
                : await this.datastore.create(this.configurationDocument) as ConfigurationDocument;
            this.projectConfiguration.update(this.clonedProjectConfiguration);
            await this.reindex();
        } catch (errWithParams) {
            this.modals.closeModal(componentInstance);
            this.messages.add(
                MessagesConversion.convertMessage(errWithParams, this.clonedProjectConfiguration, this.labels)
            );
        }

        this.changed = false;
        this.modals.closeModal(componentInstance);
    }


    private async discardChanges() {

        await this.updateProjectConfiguration(await this.fetchConfigurationDocument(), true);
        this.changed = false;
    }


    private async fetchConfigurationDocument(): Promise<ConfigurationDocument> {

        return await ConfigurationDocument.getConfigurationDocument(
            (id: string) => this.datastore.get(id, { skipCache: true }),
            this.configReader,
            this.settingsProvider.getSettings().selectedProject,
            this.settingsProvider.getSettings().username
        ) as ConfigurationDocument;
    }


    private async reindex() {

        this.updateDocumentCache();

        Tree.flatten(this.projectConfiguration.getCategories()).forEach(category => {
            CategoryForm.getFields(category).forEach(field => {
                this.indexFacade.addConstraintIndexDefinitionsForField(field);
            });
        });

        await Indexer.reindex(
            this.indexFacade,
            this.pouchdbDatastore.getDb(),
            this.documentCache,
            this.documentConverter,
            this.projectConfiguration,
            true
        );
    }


    private updateDocumentCache() {

        this.documentCache.getAll().filter(document => {
            return !this.projectConfiguration.getCategory(document.resource.category);
        }).forEach(document => this.documentCache.remove(document.resource.id));
    }
}

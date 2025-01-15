import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { nop } from 'tsfun';
import { CategoryForm, Datastore, ConfigurationDocument, ProjectConfiguration, Document, AppConfigurator,
    getConfigurationName, Field, Group, Labels, IndexFacade, Tree, InPlace, ConfigReader, Indexer,
    DocumentCache, PouchdbDatastore } from 'idai-field-core';
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
import { exportConfiguration } from './export-configuration';
import { AppState } from '../../services/app-state';
import { UtilTranslations } from '../../util/util-translations';
import { M } from '../messages/m';


@Component({
    templateUrl: './configuration.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
        '(window:click)': 'onClick($event, false)',
        '(window:contextmenu)': 'onClick($event, true)'
    },
    standalone: false
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
        { name: 'all', label: $localize `:@@configuration.categoriesFilter.all:Alle` },
        { name: 'project', label: $localize `:@@configuration.categoriesFilter.project:Projekt` },
        { name: 'trench', isRecordedInCategory: 'Trench', label: $localize `:@@configuration.categoriesFilter.trench:Schnitt` },
        { name: 'building', isRecordedInCategory: 'Building', label: $localize `:@@configuration.categoriesFilter.building:Bauwerk` },
        { name: 'survey', isRecordedInCategory: 'Survey', label: $localize `:@@configuration.categoriesFilter.survey:Survey` },
        { name: 'images', label: $localize `:@@configuration.categoriesFilter.images:Bilderverwaltung` },
        { name: 'types', label: $localize `:@@navbar.tabs.types:Typenverwaltung` },
        { name: 'inventory', label: $localize `:@@navbar.tabs.inventory:Inventarisierung` }
    ];

    public availableInputTypes: Array<InputType> = [
        { name: 'input', searchable: true, customFields: true },
        { name: 'simpleInput', searchable: true, customFields: true },
        { name: 'multiInput', searchable: true, customFields: true },
        { name: 'simpleMultiInput', searchable: true, customFields: true },
        { name: 'text', searchable: true, customFields: true },
        { name: 'int', searchable: true, customFields: true },
        { name: 'unsignedInt', searchable: true, customFields: true },
        { name: 'float', searchable: true, customFields: true },
        { name: 'unsignedFloat', searchable: true, customFields: true },
        { name: 'url', searchable: true, customFields: true },
        { name: 'dropdown',  searchable: true, customFields: true },
        { name: 'dropdownRange', searchable: true, customFields: true },
        { name: 'radio', searchable: true, customFields: true },
        { name: 'boolean', searchable: true, customFields: true },
        { name: 'checkboxes', searchable: true, customFields: true },
        { name: 'dating', customFields: true },
        { name: 'date', customFields: true },
        { name: 'dimension', customFields: true },
        { name: 'literature', customFields: true },
        { name: 'composite', customFields: true },
        { name: 'relation', customFields: true },
        { name: 'derivedRelation' },
        { name: 'instanceOf' },
        { name: 'geometry' },
        { name: 'category' },
        { name: 'identifier' }
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
                private pouchdbDatastore: PouchdbDatastore,
                private configurationState: ConfigurationState,
                private utilTranslations: UtilTranslations,
                private appState: AppState) {}


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
                await this.openProjectLanguagesModal();
                break;
            case 'valuelists':
                await AngularUtility.refresh();
                await this.openValuelistsManagementModal();
                break;
            case 'importConfiguration':
                await this.openImportConfigurationModal();
                break;
            case 'exportConfiguration':
                await this.exportConfiguration();
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

        if (!category) {
            this.selectedCategory = undefined;
        } else {
            this.selectedCategory = this.clonedProjectConfiguration.getCategory(category.name);
            this.configurationState.setSelectedCategoryName(this.selectedCategory.name);
        }
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
        componentInstance.clonedProjectConfiguration = this.clonedProjectConfiguration;
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
        componentInstance.clonedProjectConfiguration = this.clonedProjectConfiguration;
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
            MenuContext.CONFIGURATION_MODAL,
            undefined, undefined, false
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
            MenuContext.CONFIGURATION_MODAL,
            undefined, undefined, false
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
            MenuContext.CONFIGURATION_MODAL,
            undefined, undefined, false
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
            AngularUtility.blurActiveElement();
        }
    }


    public async openDiscardChangesModal(): Promise<boolean> {

        this.menus.setContext(MenuContext.CONFIGURATION_MODAL);

        try {
            const modalRef: NgbModalRef = this.modalService.open(
                EditSaveDialogComponent, { keyboard: false, animation: false }
            );
            modalRef.componentInstance.changeMessage
                = $localize `:@@configuration.changes:An der Konfiguration wurden Änderungen vorgenommen.`;
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
            await this.updateProjectConfiguration(changedConfigurationDocument, true);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            console.error(errWithParams);
            this.messages.add(errWithParams);
        }
    }


    private async openProjectLanguagesModal() {

        const [result, componentInstance] = this.modals.make<ProjectLanguagesModalComponent>(
            ProjectLanguagesModalComponent,
            MenuContext.CONFIGURATION_MANAGEMENT,
            undefined, undefined, false
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
            MenuContext.CONFIGURATION_MODAL,
            undefined, undefined, false
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.applyChanges = this.applyChanges;

        await this.modals.awaitResult(result, nop, nop);
    }


    private async exportConfiguration() {

        try {
            await exportConfiguration(
                this.configurationDocument,
                this.settingsProvider.getSettings().selectedProject,
                this.appState,
                (id: string) => this.utilTranslations.getTranslation(id)
            );
            this.messages.add([M.EXPORT_SUCCESS]);
        } catch (errWithParams) {
            if (errWithParams !== 'canceled') {
                this.messages.add(errWithParams);
            }
        }
    }


    private async loadCategories(selectedCategoriesFilterName?: string, selectedCategoryName?: string) {

        this.topLevelCategoriesArray = this.clonedProjectConfiguration.getTopLevelCategories();

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
        if (this.selectedCategory && !this.clonedProjectConfiguration.getCategory(this.selectedCategory.name)) {
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
            MenuContext.CONFIGURATION_MODAL,
            undefined, undefined, false
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
            (id: string) => this.datastore.get(id, { skipCache: true }),
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

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Map, isArray, isObject, nop } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Datastore, FieldDocument, IndexFacade, Labels,
    ProjectConfiguration, WarningType, ConfigReader, Group, Resource, Field, ValuelistUtil, Valuelist, Tree,
    MissingRelationTargetWarnings, InvalidDataUtil, Document, Hierarchy } from 'idai-field-core';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';
import { WarningFilter, WarningFilters } from '../../../services/warnings/warning-filters';
import { UtilTranslations } from '../../../util/util-translations';
import { Modals } from '../../../services/modals';
import { ConfigurationConflictsModalComponent } from '../../configuration/conflicts/configuration-conflicts-modal.component';
import { DoceditComponent } from '../../docedit/docedit.component';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import { Settings } from '../../../services/settings/settings';
import { DeleteFieldDataModalComponent } from './delete-field-data-modal.component';
import { AngularUtility } from '../../../angular/angular-utility';
import { getInputTypeLabel } from '../../../util/get-input-type-label';
import { CleanUpRelationModalComponent } from './clean-up-relation-modal.component';
import { MenuModalLauncher } from '../../../services/menu-modal-launcher';
import { DeleteResourceModalComponent } from './delete-resource-modal.component';


type WarningSection = {
    type: WarningType;
    category?: CategoryForm;
    unconfiguredCategoryName?: string;
    fieldName?: string;
    dataLabel?: string;
    outlierValues?: string[];
}


@Component({
    templateUrl: './warnings-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class WarningsModalComponent {

    public warningFilters: Array<WarningFilter>;
    public getConstraints: () => Map<string>;
    public preselectedDocumentId: string|undefined;

    public categoryFilters: Array<CategoryForm>;
    public selectedWarningFilter: WarningFilter;
    public selectedDocument: FieldDocument|undefined;
    public sections: Array<WarningSection> = [];
    public hasConfigurationConflict: boolean;


    constructor(private activeModal: NgbActiveModal,
                private projectConfiguration: ProjectConfiguration,
                private menuModalLauncher: MenuModalLauncher,
                private menus: Menus,
                private indexFacade: IndexFacade,
                private datastore: Datastore,
                private modals: Modals,
                private utilTranslations: UtilTranslations,
                private settingsProvider: SettingsProvider,
                private configReader: ConfigReader,
                private labels: Labels,
                private i18n: I18n) {}

        
    public getSections = () => this.sections.filter(section => this.isSectionVisible(section));


    public initialize() {

        this.categoryFilters = this.getCategoryFilters();
        this.selectWarningFilter(this.warningFilters[0].constraintName);
        AngularUtility.blurActiveElement();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.WARNINGS) {
            this.close();
        }
    }


    public getCategoryLabel(section: WarningSection): string {

        return this.labels.get(section.category);
    }


    public getFieldLabel(section: WarningSection): string {
        
        return this.getFieldOrRelationLabel(section) ?? section.fieldName;
    }


    public getInputTypeLabel(section: WarningSection): string {

        const inputType: Field.InputType = CategoryForm.getField(section.category, section.fieldName).inputType;
        return getInputTypeLabel(inputType, this.utilTranslations);
    }


    public getValuelistId(section: WarningSection): string {

        return CategoryForm.getField(section.category, section.fieldName)?.valuelist?.id;
    }


    public getIdentifierPrefix(section: WarningSection): string {

        return section.category.identifierPrefix;
    }


    public getMissingRelationTargetIds(section: WarningSection): string[] {

        return this.selectedDocument.resource.relations[section.fieldName]?.filter(targetId => {
            return this.selectedDocument.warnings?.missingRelationTargets?.targetIds.includes(targetId);
        }) ?? [];
    }


    public selectWarningFilter(constraintName: string) {

        this.selectedWarningFilter = this.warningFilters.find(filter => filter.constraintName === constraintName)
            ?? this.warningFilters[0];
        this.updateDocumentsList();
    }


    public selectDocument(document: FieldDocument) {

        this.selectedDocument = document;
        this.updateSections(document);
    }


    public async openConflictResolver() {

        if (this.selectedDocument.resource.category === 'Configuration') {
            await this.openConfigurationConflictsModal();
        } else if (this.selectedDocument.resource.category === 'Project') {
            await this.menuModalLauncher.editProject('conflicts');
        } else {
            await this.openResourceConflictsModal(this.selectedDocument)
        }

        AngularUtility.blurActiveElement();
        await this.update();
    };


    public async openDoceditModal(section?: WarningSection) {

        if (section.type === 'unconfiguredCategory') return;

        const [result, componentInstance] = this.modals.make<DoceditComponent>(
            DoceditComponent,
            MenuContext.DOCEDIT,
            'lg',
            undefined,
            false
        );

        componentInstance.setDocument(this.selectedDocument);

        if (section) {
            componentInstance.scrollTargetField = section.fieldName;
            const group: Group = section.category.groups.find(group => {
                return group.fields.find(field => field.name === section.fieldName) !== undefined;
            });
            if (group) componentInstance.activeGroup = group.name;
        }        

        await this.modals.awaitResult(
            result,
            () => this.update(),
            nop
        );

        AngularUtility.blurActiveElement();
    }


    public async openDeleteResourceModal() {

        const [result, componentInstance] = this.modals.make<DeleteResourceModalComponent>(
            DeleteResourceModalComponent,
            MenuContext.MODAL
        );

        componentInstance.document = this.selectedDocument;

        await this.modals.awaitResult(
            result,
            () => this.update(),
            nop
        );

        AngularUtility.blurActiveElement();
    }


    public async openDeleteFieldDataModal(section: WarningSection) {

        const [result, componentInstance] = this.modals.make<DeleteFieldDataModalComponent>(
            DeleteFieldDataModalComponent,
            MenuContext.MODAL
        );

        componentInstance.document = this.selectedDocument;
        componentInstance.fieldName = section.fieldName;
        componentInstance.fieldLabel = this.getFieldOrRelationLabel(section);
        componentInstance.category = section.category;
        componentInstance.warningType = section.type;

        await this.modals.awaitResult(
            result,
            () => this.update(),
            nop
        );

        AngularUtility.blurActiveElement();
    }


    public async openCleanUpRelationModal(section: WarningSection) {

        const [result, componentInstance] = this.modals.make<CleanUpRelationModalComponent>(
            CleanUpRelationModalComponent,
            MenuContext.MODAL
        );

        componentInstance.document = this.selectedDocument;
        componentInstance.relationName = section.fieldName;
        componentInstance.relationLabel = this.getFieldOrRelationLabel(section);
        componentInstance.invalidTargetIds = this.getMissingRelationTargetIds(section);

        await this.modals.awaitResult(
            result,
            () => this.update(),
            nop
        );

        AngularUtility.blurActiveElement();
    }


    public close() {

        this.activeModal.dismiss('cancel');
    }


    public isConfigurationOptionVisible(): boolean {

        return this.hasConfigurationConflict
            && (this.selectedWarningFilter.constraintName === 'warnings:exist'
                || this.selectedWarningFilter.constraintName === 'conflicts:exist');
    }


    private isSectionVisible(section: WarningSection): boolean {
        
        const type: WarningType|undefined = this.selectedWarningFilter?.type;

        return !type || type === section.type;
    }


    private getCategoryFilters(): Array<CategoryForm> {

        const result: Array<CategoryForm> = Tree.flatten(this.projectConfiguration.getCategories())
            .filter(category => !category.parentCategory);

        return this.hasConfigurationConflict
            ? [this.getConfigurationCategory()].concat(result)
            : result
    }


    private getConfigurationCategory(): CategoryForm {

        return {
            name: 'Configuration',
            label: this.i18n({
                id: 'navbar.tabs.configuration', value: 'Projektkonfiguration'
            }),
            children: []
        } as any;
    }


    private async update() {

        this.hasConfigurationConflict = await WarningFilters.hasConfigurationConflict(this.datastore);
        this.warningFilters = await WarningFilters.getWarningFilters(
            this.indexFacade, this.utilTranslations, this.hasConfigurationConflict
        );

        if (this.warningFilters.length > 0) {
            this.selectWarningFilter(this.selectedWarningFilter.constraintName);
        } else {
            this.close();
        }
    }


    private updateDocumentsList() {

        this.getConstraints = () => {
            const constraints: Map<string> = {};
            constraints[this.selectedWarningFilter.constraintName] = 'KNOWN';
            return constraints;
        };
    }


    private async updateSections(document: FieldDocument) {

        if (!document) {
            this.sections = [];
        } else if (document.resource.category === 'Configuration') {
            this.sections = [{ type: 'conflicts' }];
        } else if (!document?.warnings) {
            this.sections = [];
        } else {
            this.sections = [];
            for (let type of Object.keys(document.warnings)) {
                if (isArray(document.warnings[type])) {
                    this.sections = this.sections.concat(
                        await this.createSections(type as WarningType, document, document.warnings[type] as string[])
                    );
                } else if (isObject(document.warnings[type])) {
                    this.sections = this.sections.concat(await this.createSections(
                        type as WarningType, document,
                        (document.warnings[type] as MissingRelationTargetWarnings).relationNames
                    ));
                } else {
                    this.sections = this.sections.concat([await this.createSection(type as WarningType, document)]);
                }
            }
        }
    }


    private async createSections(type: WarningType, document: FieldDocument,
                                 fieldNames: string[]): Promise<Array<WarningSection>> {

        const newSections: Array<WarningSection> = [];

        for (let fieldName of fieldNames) {
            newSections.push(await this.createSection(type, document, fieldName));
        }

        return newSections;
    }


    private async createSection(type: WarningType, document: FieldDocument, fieldName?: string): Promise<WarningSection> {

        const section: WarningSection = { type };

        if (type === 'missingIdentifierPrefix' || type === 'nonUniqueIdentifier') {
            section.fieldName = Resource.IDENTIFIER;
        } else if (fieldName) {
            section.fieldName = fieldName;
        }
        
        if (document.warnings.unconfiguredCategory) {
            section.unconfiguredCategoryName = document.resource.category;
        } else if (document.resource.category !== 'Configuration') {
            section.category = this.projectConfiguration.getCategory(document.resource.category);
        };

        if (type === 'invalidFields' || type === 'unconfiguredFields') {
            section.dataLabel = InvalidDataUtil.generateLabel(document.resource[fieldName], this.labels);
        } else if (type === 'missingIdentifierPrefix') {
            section.dataLabel = document.resource.identifier
        }

        if (type === 'outlierValues') {
            section.outlierValues = await this.getOutlierValues(document, fieldName, section.category);
        }

        return section;
    }


    private async getOutlierValues(document: FieldDocument, fieldName: string, category: CategoryForm): Promise<string[]> {

        const field: Field = CategoryForm.getField(category, fieldName);
        const projectDocument: Document = await this.datastore.get('project');
        const parentResource: Resource = await Hierarchy.getParentResource(this.datastore.get, document.resource);

        const valuelist: Valuelist = ValuelistUtil.getValuelist(field, projectDocument, parentResource);

        return ValuelistUtil.getValuesNotIncludedInValuelist(document.resource[fieldName], valuelist);
    }


    private async openConfigurationConflictsModal() {

        const [result, componentInstance] = this.modals.make<ConfigurationConflictsModalComponent>(
            ConfigurationConflictsModalComponent,
            MenuContext.DOCEDIT,
            'lg'
        );

        const settings: Settings = this.settingsProvider.getSettings();

        componentInstance.configurationDocument = await ConfigurationDocument.getConfigurationDocument(
            id => this.datastore.get(id),
            this.configReader,
            settings.selectedProject,
            settings.username
        );
        componentInstance.initialize();

        await this.modals.awaitResult(result, nop, nop);
    }


    private async openResourceConflictsModal(document: FieldDocument) {

        const [result, componentInstance] = this.modals.make<DoceditComponent>(
            DoceditComponent,
            MenuContext.DOCEDIT,
            'lg'
        );

        componentInstance.setDocument(document);
        componentInstance.activeGroup = 'conflicts';

        await this.modals.awaitResult(result, nop, nop);
    }


    private getFieldOrRelationLabel(section: WarningSection): string {

        return this.labels.getFieldLabel(
            this.projectConfiguration.getCategory(this.selectedDocument.resource.category),
            section.fieldName
        ) ?? this.labels.getRelationLabel(section.fieldName)
    }
}

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Map, flatten, isArray, nop } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Datastore, FieldDocument, IndexFacade, Labels, ProjectConfiguration,
    WarningType, ConfigReader, Group, Resource, Field, Tree, InvalidDataUtil, OutlierWarnings,
    RelationTargetWarnings } from 'idai-field-core';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';
import { WarningFilter, WarningFilters } from '../../../services/warnings/warning-filters';
import { UtilTranslations } from '../../../util/util-translations';
import { Modals } from '../../../services/modals';
import { ConfigurationConflictsModalComponent } from '../../configuration/conflicts/configuration-conflicts-modal.component';
import { DoceditComponent } from '../../docedit/docedit.component';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import { Settings } from '../../../services/settings/settings';
import { DeleteFieldDataModalComponent } from './modals/delete-field-data-modal.component';
import { AngularUtility } from '../../../angular/angular-utility';
import { getInputTypeLabel } from '../../../util/get-input-type-label';
import { CleanUpRelationModalComponent } from './modals/clean-up-relation-modal.component';
import { MenuModalLauncher } from '../../../services/menu-modal-launcher';
import { DeleteResourceModalComponent } from './modals/delete-resource-modal.component';
import { FixOutliersModalComponent } from './modals/fix-outliers-modal.component';
import { DeleteOutliersModalComponent } from './modals/delete-outliers-modal.component';
import { ConvertFieldDataModalComponent } from './modals/convert-field-data-modal.component';
import { SelectNewFieldModalComponent } from './modals/select-new-field-modal.component';
import { SelectNewCategoryModalComponent } from './modals/select-new-category-modal.component';
import { MoveModalComponent, MoveResult } from '../../widgets/move-modal/move-modal.component';
import { WarningsService } from '../../../services/warnings/warnings-service';


type WarningSection = {
    type: WarningType;
    category?: CategoryForm;
    unconfiguredCategoryName?: string;
    fieldName?: string;
    inputType?: Field.InputType;
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
                private warningsService: WarningsService) {}

        
    public getSections = () => this.sections.filter(section => this.isSectionVisible(section));

    public isModalOpened = () => this.menus.getContext() !== MenuContext.WARNINGS;


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

        return getInputTypeLabel(section.inputType, this.utilTranslations);
    }


    public getValuelistId(section: WarningSection): string {

        return CategoryForm.getField(section.category, section.fieldName)?.valuelist?.id;
    }


    public getIdentifierPrefix(section: WarningSection): string {

        return section.category.identifierPrefix;
    }


    public getRelationTargetIds(section: WarningSection): string[] {

        return this.selectedDocument.resource.relations[section.fieldName]?.filter(targetId => {
            const warnings: RelationTargetWarnings
                = this.selectedDocument.warnings?.[section.type] as RelationTargetWarnings;
            return warnings?.targetIds.includes(targetId);
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

        console.log({document})
        console.log(this.sections)
    }


    public isConvertible(section: WarningSection): boolean {

        const fieldData: any = this.selectedDocument.resource[section.fieldName];
        if (fieldData === undefined) return false;

        return InvalidDataUtil.isConvertible(
            this.selectedDocument.resource[section.fieldName],
            section.inputType
        );
    }


    public async fixOutliers(section: WarningSection) {

        let changed: boolean = false;

        for (let outlierValue of section.outlierValues) {
            const completed: boolean = await this.openFixOutliersModal(section, outlierValue);
            if (!completed) break;

            changed = true;
        }

        if (changed) await this.update();
    }


    public async deleteOutliers(section: WarningSection) {

        let changed: boolean = false;

        for (let outlierValue of section.outlierValues) {
            const completed: boolean = await this.openDeleteOutliersModal(section, outlierValue);
            if (!completed) break;

            changed = true;
            if (!this.selectedDocument.resource[section.fieldName]) break;
        }

        if (changed) await this.update();
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

        if (this.sections.find(section => {
            return section.type === 'unconfiguredCategory' || section.type === 'missingOrInvalidParent';
        })) return;

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


    public async openDeleteResourceModal(section: WarningSection) {

        const [result, componentInstance] = this.modals.make<DeleteResourceModalComponent>(
            DeleteResourceModalComponent,
            MenuContext.MODAL
        );

        componentInstance.document = this.selectedDocument;
        componentInstance.warningType = section.type;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            () => this.update(),
            nop
        );

        AngularUtility.blurActiveElement();
    }


    public async openConvertFieldDataModal(section: WarningSection) {

        const [result, componentInstance] = this.modals.make<ConvertFieldDataModalComponent>(
            ConvertFieldDataModalComponent,
            MenuContext.MODAL
        );

        componentInstance.document = this.selectedDocument;
        componentInstance.fieldName = section.fieldName;
        componentInstance.fieldLabel = this.getFieldOrRelationLabel(section);
        componentInstance.category = section.category;
        componentInstance.inputType = section.inputType;
        componentInstance.inputTypeLabel = this.getInputTypeLabel(section);
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            () => this.update(),
            nop
        );

        AngularUtility.blurActiveElement();
    }


    public async openSelectNewFieldModal(section: WarningSection) {

        const [result, componentInstance] = this.modals.make<SelectNewFieldModalComponent>(
            SelectNewFieldModalComponent,
            MenuContext.MODAL
        );

        componentInstance.document = this.selectedDocument;
        componentInstance.fieldName = section.fieldName;
        componentInstance.fieldLabel = this.getFieldOrRelationLabel(section);
        componentInstance.category = section.category;
        componentInstance.warningType = section.type;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            () => this.update(),
            nop
        );

        AngularUtility.blurActiveElement();
    }


    public async openSelectNewCategoryModal() {

        const [result, componentInstance] = this.modals.make<SelectNewCategoryModalComponent>(
            SelectNewCategoryModalComponent,
            MenuContext.MODAL
        );

        componentInstance.document = this.selectedDocument;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            () => this.update(),
            nop
        );

        AngularUtility.blurActiveElement();
    }


    public async openMoveModal() {

        const [result, componentInstance] = this.modals.make<MoveModalComponent>(
            MoveModalComponent,
            MenuContext.MODAL
        );

        componentInstance.initialize([this.selectedDocument]);

        await this.modals.awaitResult(
            result,
            (result: MoveResult) => {
                if (result.success) {
                    this.warningsService.reportWarningsResolved();
                    this.update();
                }
            },
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
        componentInstance.initialize();

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
        componentInstance.invalidTargetIds = this.getRelationTargetIds(section);
        componentInstance.warningType = section.type;

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
            label: $localize `:@@navbar.tabs.configuration:Projektkonfiguration`,
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
                switch (type) {
                    case 'unconfiguredFields':
                    case 'invalidFields':
                        this.sections = this.sections.concat(
                            await this.createSections(
                                type as WarningType, document, document.warnings[type] as string[]
                            )
                        );
                        break;
                    case 'missingRelationTargets':
                    case 'invalidRelationTargets':
                        this.sections = this.sections.concat(await this.createSections(
                            type as WarningType, document,
                            (document.warnings[type] as RelationTargetWarnings).relationNames
                        ));
                        break;
                    case 'outliers':
                        this.sections = this.sections.concat(await this.createSections(
                            type as WarningType, document,
                            Object.keys((document.warnings[type] as OutlierWarnings).fields)
                        ));
                        break;
                    default:
                        this.sections = this.sections.concat([
                            await this.createSection(type as WarningType, document)
                        ]);
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
            if (fieldName
                    && !['unconfiguredFields', 'missingRelationTargets', 'invalidRelationTargets'].includes(type)) {
                section.inputType = CategoryForm.getField(section.category, fieldName).inputType;
            }
        };

        if (type === 'invalidFields' || type === 'unconfiguredFields') {
            section.dataLabel = InvalidDataUtil.generateLabel(document.resource[fieldName], this.labels);
        } else if (type === 'missingIdentifierPrefix') {
            section.dataLabel = document.resource.identifier;
        }

        if (type === 'outliers') {
            const outlierValues: Map<string[]>|string[] = document.warnings.outliers.fields[fieldName];
            section.outlierValues = isArray(outlierValues)
                ? outlierValues
                : flatten(Object.values(outlierValues));
        }

        return section;
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
        await componentInstance.initialize();

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


    private async openFixOutliersModal(section: WarningSection, outlierValue: string): Promise<boolean> {

        const [result, componentInstance] = this.modals.make<FixOutliersModalComponent>(
            FixOutliersModalComponent,
            MenuContext.MODAL
        );

        const field: Field = CategoryForm.getField(section.category, section.fieldName);
    
        componentInstance.document = this.selectedDocument;
        componentInstance.field = field;
        componentInstance.outlierValue = outlierValue;
        await componentInstance.initialize();

        let changed: boolean;

        await this.modals.awaitResult(
            result,
            () => changed = true,
            nop
        );

        AngularUtility.blurActiveElement();

        return changed;
    }


    private async openDeleteOutliersModal(section: WarningSection, outlierValue: string): Promise<boolean> {

        const [result, componentInstance] = this.modals.make<DeleteOutliersModalComponent>(
            DeleteOutliersModalComponent,
            MenuContext.MODAL
        );

        const field: Field = CategoryForm.getField(section.category, section.fieldName);
    
        componentInstance.document = this.selectedDocument;
        componentInstance.field = field;
        componentInstance.fieldLabel = this.getFieldOrRelationLabel(section);
        componentInstance.outlierValue = outlierValue;
        await componentInstance.initialize();

        let changed: boolean;

        await this.modals.awaitResult(
            result,
            () => changed = true,
            nop
        );

        AngularUtility.blurActiveElement();

        return changed;
    }


    private getFieldOrRelationLabel(section: WarningSection): string {

        return this.labels.getFieldLabel(
            this.projectConfiguration.getCategory(this.selectedDocument.resource.category),
            section.fieldName
        ) ?? this.labels.getRelationLabel(section.fieldName, this.projectConfiguration.getRelations());
    }
}

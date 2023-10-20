import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Map, isArray, isObject, nop } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Datastore, FieldDocument, IndexFacade, Labels,
    ProjectConfiguration, WarningType, ConfigReader, Group, Resource, FieldsViewUtil, FieldsViewSubfield, 
    Field, ValuelistUtil, Valuelist } from 'idai-field-core';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';
import { WarningFilter, WarningFilters } from './warning-filters';
import { UtilTranslations } from '../../../util/util-translations';
import { ProjectModalLauncher } from '../../../services/project-modal-launcher';
import { Modals } from '../../../services/modals';
import { ConfigurationConflictsModalComponent } from '../../configuration/conflicts/configuration-conflicts-modal.component';
import { DoceditComponent } from '../../docedit/docedit.component';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import { Settings } from '../../../services/settings/settings';
import { DeleteFieldDataModalComponent } from './delete-field-data-modal.component';
import { AngularUtility } from '../../../angular/angular-utility';
import { getInputTypeLabel } from '../../../util/get-input-type-label';


type WarningSection = {
    type: WarningType;
    category?: CategoryForm;
    fieldName?: string;
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
    public categoryFilters: Array<CategoryForm>;
    public getConstraints: () => Map<string>;

    public selectedWarningFilter: WarningFilter;
    public selectedDocument: FieldDocument|undefined;
    public sections: Array<WarningSection> = [];
    public hasConfigurationConflict: boolean;


    constructor(private activeModal: NgbActiveModal,
                private projectConfiguration: ProjectConfiguration,
                private projectModalLauncher: ProjectModalLauncher,
                private menus: Menus,
                private indexFacade: IndexFacade,
                private datastore: Datastore,
                private modals: Modals,
                private utilTranslations: UtilTranslations,
                private settingsProvider: SettingsProvider,
                private configReader: ConfigReader,
                private decimalPipe: DecimalPipe,
                private labels: Labels,
                private i18n: I18n) {}

    
    public initialize() {

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
        
        return this.labels.getFieldLabel(
            this.projectConfiguration.getCategory(this.selectedDocument.resource.category),
            section.fieldName
        ) ?? section.fieldName;
    }


    public getDataLabel(section: WarningSection): string {

        const field: FieldsViewSubfield = {
            name: section.fieldName,
            valuelist: CategoryForm.getField(section.category, section.fieldName)?.valuelist
        } as FieldsViewSubfield;

        const data: any = this.selectedDocument.resource[section.fieldName];
        const entries: any = isArray(data) ? data : [data];

        return entries.map(entry => {
            if (isObject(entry)) {
                return FieldsViewUtil.getObjectLabel(
                    entry,
                    field,
                    (key: string) => this.utilTranslations.getTranslation(key),
                    (value: number) => this.decimalPipe.transform(value),
                    this.labels
                );
            } else {
                return entry;
            }
        }).join(', ');
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


    public getOutlierValues(section: WarningSection): string[] {

        const valuelist: Valuelist = CategoryForm.getField(section.category, section.fieldName).valuelist;

        return ValuelistUtil.getValuesNotIncludedInValuelist(
            this.selectedDocument.resource[section.fieldName], valuelist
        );
    }


    public getWarningTypeLabel(section: WarningSection): string {

        switch(section.type) {
            case 'conflicts':
                return this.i18n({ id: 'taskbar.warnings.conflicts.single', value: 'Konflikt' });
            case 'unconfigured':
                return this.i18n({ id: 'taskbar.warnings.unconfigured.single', value: 'Unkonfiguriertes Feld' });
            case 'invalid':
                return this.i18n({ id: 'taskbar.warnings.invalidFieldData', value: 'Ungültige Daten im Feld' });
            case 'outlierValues':
                return this.i18n({ id: 'taskbar.warnings.outlierValues', value: 'Ungültiger Wert im Feld' });
            case 'missingIdentifierPrefix':
                return this.i18n({ id: 'taskbar.warnings.missingIdentifierPrefix', value: 'Fehlendes Präfix im Feld' });
            case 'nonUniqueIdentifier':
                return this.i18n({ id: 'taskbar.warnings.nonUniqueIdentifier', value: 'Nicht eindeutiger Bezeichner' });
        }
    }


    public isFieldLabelVisible(section: WarningSection): boolean {

        return ['unconfigured', 'invalid', 'outlierValues', 'missingIdentifierPrefix'].includes(section.type);
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
            await this.projectModalLauncher.editProject('conflicts');
        } else {
            await this.openResourceConflictsModal(this.selectedDocument)
        }

        AngularUtility.blurActiveElement();
        await this.update();
    };


    public async openDoceditModal(section?: WarningSection) {

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


    public async openDeleteFieldDataModal(section: WarningSection) {

        const [result, componentInstance] = this.modals.make<DeleteFieldDataModalComponent>(
            DeleteFieldDataModalComponent,
            MenuContext.MODAL
        );

        componentInstance.document = this.selectedDocument;
        componentInstance.fieldName = section.fieldName;
        componentInstance.fieldLabel = this.labels.getFieldLabel(section.category, section.fieldName);
        componentInstance.category = section.category;
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


    private async update() {

        this.hasConfigurationConflict = await WarningFilters.hasConfigurationConflict(this.datastore);
        this.warningFilters = await WarningFilters.getWarningFilters(
            this.indexFacade, this.utilTranslations, this.hasConfigurationConflict
        );
        this.selectWarningFilter(this.selectedWarningFilter.constraintName);
    }


    private updateDocumentsList() {

        this.getConstraints = () => {
            const constraints: Map<string> = {};
            constraints[this.selectedWarningFilter.constraintName] = 'KNOWN';
            return constraints;
        };
    }


    private updateSections(document: FieldDocument) {

        if (!document) {
            this.sections = [];
        } else if (document.resource.category === 'Configuration') {
            this.sections = [{ type: 'conflicts' }];
        } else if (!document?.warnings) {
            this.sections = [];
        } else {
            this.sections = Object.keys(document.warnings).reduce((sections, type: WarningType) => {
                if (isArray(document.warnings[type])) {
                    return sections.concat(
                        (document.warnings[type] as string[]).map(fieldName => {
                            return this.createSection(type, document, fieldName);
                        })
                    );
                } else {
                    return sections.concat([this.createSection(type, document)]);
                }
            }, []);
        }
    }


    private createSection(type: WarningType, document: FieldDocument, fieldName?: string): WarningSection {

        const section: WarningSection = { type };

        if (type === 'missingIdentifierPrefix' || type === 'nonUniqueIdentifier') {
            section.fieldName = Resource.IDENTIFIER;
        } else if (fieldName) {
            section.fieldName = fieldName;
        }
        
        if (document.resource.category !== 'Configuration') {
            section.category = this.projectConfiguration.getCategory(document.resource.category);
        };

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
}
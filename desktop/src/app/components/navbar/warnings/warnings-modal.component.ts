import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Map, isArray, nop } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Datastore, FieldDocument, IndexFacade, Labels,
    ProjectConfiguration, WarningType, ConfigReader } from 'idai-field-core';
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


type WarningSection = {
    type: WarningType;
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
                private labels: Labels,
                private i18n: I18n) {}

    
    public initialize() {

        this.selectWarningFilter(this.warningFilters[0].constraintName);
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.WARNINGS) {
            this.close();
        }
    }


    public getFieldLabel(section: WarningSection) {
        
        return this.labels.getFieldLabel(
            this.projectConfiguration.getCategory(this.selectedDocument.resource.category),
            section.fieldName
        ) ?? section.fieldName;
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
                return this.i18n({ id: 'taskbar.warnings.missingIdentifierPrefix', value: 'Fehlendes Bezeichner-Präfix' });
        }
    }


    public isFieldLabelVisible(section: WarningSection): boolean {

        return ['unconfigured', 'invalid', 'outlierValues'].includes(section.type);
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

        await this.update();
    };


    public async openDeleteFieldDataModal(section: WarningSection) {

        const [result, componentInstance] = this.modals.make<DeleteFieldDataModalComponent>(
            DeleteFieldDataModalComponent,
            MenuContext.MODAL
        );

        const category: CategoryForm = this.projectConfiguration.getCategory(this.selectedDocument.resource.category);

        componentInstance.document = this.selectedDocument;
        componentInstance.fieldName = section.fieldName;
        componentInstance.fieldLabel = this.labels.getFieldLabel(category, section.fieldName);
        componentInstance.category = category;
        componentInstance.warningType = section.type;

        await this.modals.awaitResult(
            result,
            () => this.update(),
            nop
        );
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
            this.sections = [{ type: 'conflicts'} ];
        } else if (!document?.warnings) {
            this.sections = [];
        } else {
            this.sections = Object.keys(document.warnings).reduce((sections, warningType) => {
                if (isArray(document.warnings[warningType])) {
                    return sections.concat(
                        document.warnings[warningType].map(fieldName => {
                            return { type: warningType, fieldName };
                        })
                    );
                } else {
                    return sections.concat([{ type: warningType }]);
                }
            }, []);
        }
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

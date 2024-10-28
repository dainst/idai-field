import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { nop, to } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Field, SortUtil, Labels, ProjectConfiguration } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { Modals } from '../../../../services/modals';
import { FieldEditorModalComponent } from '../../editor/field/field-editor-modal.component';
import { MenuContext } from '../../../../services/menu-context';
import { InputType } from '../../configuration-util';
import { Menus } from '../../../../services/menus';
import { SettingsProvider } from '../../../../services/settings/settings-provider';
import { Naming } from '../naming';


@Component({
    templateUrl: './add-field-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class AddFieldModalComponent {

    public configurationDocument: ConfigurationDocument;
    public category: CategoryForm;
    public groupName: string;
    public availableInputTypes: Array<InputType>;
    public permanentlyHiddenFields: string[];
    public clonedProjectConfiguration: ProjectConfiguration;
    public applyChanges: (configurationDocument: ConfigurationDocument) => Promise<void>;

    public searchTerm: string = '';
    public selectedField: Field|undefined;
    public emptyField: Field|undefined;
    public fields: Array<Field> = [];


    constructor(public activeModal: NgbActiveModal,
                private configurationIndex: ConfigurationIndex,
                private modals: Modals,
                private menus: Menus,
                private labels: Labels,
                private settingsProvider: SettingsProvider) {}


    public initialize() {
    
        this.applyFieldNameSearch();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.CONFIGURATION_MANAGEMENT) {
            this.activeModal.dismiss('cancel');
        }
    }


    public select(field: Field) {

        if (field === this.emptyField) {
            this.createNewField();
        } else {
            this.selectedField = field;
        }
    }


    public confirmSelection() {

        if (!this.selectedField) return;

        this.addSelectedField();
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public applyFieldNameSearch() {

        this.fields = this.configurationIndex.findFields(
            this.searchTerm,
            this.category.source === 'custom' ? this.category.parentCategory.name : this.category.name
        )
            .concat(this.configurationIndex.findFields(this.searchTerm, 'commons'))
            .filter(field => (field.visible || field.editable)
                && !CategoryForm.getFields(this.category).map(to('name')).includes(field.name))
            .sort((field1, field2) => SortUtil.alnumCompare(this.labels.get(field1), this.labels.get(field2)));

        this.selectedField = this.fields?.[0];
        this.emptyField = this.getEmptyField();
    }


    private addSelectedField() {

        const updatedConfigurationDocument = ConfigurationDocument.addField(
            this.configurationDocument, this.category, this.permanentlyHiddenFields,
            this.groupName, this.selectedField.name
        );

        try {
            this.applyChanges(updatedConfigurationDocument);
            this.activeModal.close();
        } catch {
            // Stay in modal
        }
    }


    private async createNewField() {

        const [result, componentInstance] = this.modals.make<FieldEditorModalComponent>(
            FieldEditorModalComponent,
            MenuContext.CONFIGURATION_EDIT,
            'lg'
        );

        componentInstance.applyChanges = this.applyChanges;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = this.category;
        componentInstance.field = {
            name: this.emptyField.name,
            inputType: 'input',
            label: {},
            defaultLabel: {},
            description: {},
            defaultDescription: {},
            source: 'custom'
        };
        componentInstance.groupName = this.groupName;
        componentInstance.availableInputTypes = this.availableInputTypes;
        componentInstance.permanentlyHiddenFields = this.permanentlyHiddenFields;
        componentInstance.clonedProjectConfiguration = this.clonedProjectConfiguration;
        componentInstance.new = true;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            () => this.activeModal.close(),
            nop
        );
    }


    private getEmptyField(): Field|undefined {

        if (this.searchTerm.length === 0) return undefined;

        return {
            name: Naming.getFieldOrGroupName(this.searchTerm, this.settingsProvider.getSettings().selectedProject)
        } as Field;
    }
}

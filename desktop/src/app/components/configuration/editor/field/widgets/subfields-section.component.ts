import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { on, is, isArray, isString, isEmpty, Map } from 'tsfun';
import { CategoryForm, ConfigurationDocument, CustomFieldDefinition, CustomFormDefinition,
    CustomSubfieldDefinition, Field, I18N, InPlace, Labels, Named, Subfield, SubfieldCondition,
    Valuelists } from 'idai-field-core';
import { InputType } from '../../../configuration-util';
import { SubfieldEditorData, SubfieldEditorModalComponent } from '../subfield-editor-modal.component';
import { MenuContext } from '../../../../../services/menu-context';
import { Naming } from '../../../add/naming';
import { Modals } from '../../../../../services/modals';
import { AngularUtility } from '../../../../../angular/angular-utility';


@Component({
    selector: 'subfields-section',
    templateUrl: './subfields-section.html'
})
/**
 * @author Thomas Kleinke
 */
export class SubfieldsSectionComponent {

    @Input() clonedFormDefinition: CustomFormDefinition;
    @Input() clonedFieldDefinition: CustomFieldDefinition;
    @Input() clonedField: Field;
    @Input() category: CategoryForm;
    @Input() availableInputTypes: Array<InputType>;
    @Input() projectLanguages: string[];
    @Input() configurationDocument: ConfigurationDocument;
    @Input() clonedConfigurationDocument: ConfigurationDocument;
    @Input() subfieldI18nStrings: Map<{ label?: I18N.String, description?: I18N.String }>;
    @Input() applyChanges: (configurationDocument: ConfigurationDocument, reindexConfiguration?: boolean) =>
        Promise<ConfigurationDocument>;

    @Output() onDrag: EventEmitter<boolean> = new EventEmitter<boolean>();

    public newSubfieldName: string;

    public newSubfieldInputPlaceholder: string = this.i18n({
        id: 'configuration.newSubfield', value: 'Neues Unterfeld'
    });

  
    constructor(private labels: Labels,
                private modals: Modals,
                private i18n: I18n) {}


    public getClonedSubfieldDefinitions = () => this.clonedFieldDefinition.subfields;

    public onDragStarted = () => this.onDrag.emit(true);
    
    public onDragEnded = () => this.onDrag.emit(false);


    public getSubfieldLabel(subfieldDefinition: CustomSubfieldDefinition) {
        
        return this.labels.get(this.getClonedSubfield(subfieldDefinition));
    }


    public getConditionSubfieldLabel(condition: SubfieldCondition): string {

        const subfield: Subfield = this.clonedField.subfields?.find(on(Named.NAME, is(condition.subfieldName)));

        return subfield ? this.labels.get(subfield) : '';
    }


    public getConditionValueLabels(condition: SubfieldCondition): string {

        const subfield: Subfield = this.clonedField.subfields?.find(on(Named.NAME, is(condition.subfieldName)));

        return subfield
            ? (condition.values as string[])
                .map(valueId => this.labels.getValueLabel(subfield.valuelist, valueId))
                .join(', ')
            : '';
    }


    public getInputTypeLabel(subfield: CustomSubfieldDefinition): string {

        return this.availableInputTypes.find(on(Named.NAME, is(subfield.inputType))).label;
    }

    
    public isValidSubfieldName(subfieldName: string): boolean {

        if (!subfieldName) return false;

        const adjustedName: string = Naming.getSubfieldName(subfieldName);
        return this.getClonedSubfieldDefinitions().find(on(Named.NAME, is(adjustedName))) === undefined;
    }


    public async createSubfield() {

        const adjustedName: string = Naming.getSubfieldName(this.newSubfieldName);
        this.newSubfieldName = '';

        const newSubfieldDefinition: CustomSubfieldDefinition = {
            name: adjustedName,
            inputType: Field.InputType.INPUT
        };

        const newSubfield: Subfield = {
            name: adjustedName,
            inputType: Field.InputType.INPUT,
            label: {},
            description: {}
        };

        const [result, componentInstance] = this.modals.make<SubfieldEditorModalComponent>(
            SubfieldEditorModalComponent,
            MenuContext.CONFIGURATION_SUBFIELD_EDIT,
            undefined,
            'subfield-editor-modal'
        );

        componentInstance.subfield = newSubfield;
        componentInstance.parentField = this.clonedField;
        componentInstance.category = this.category;
        componentInstance.subfields = this.clonedField.subfields;
        componentInstance.availableInputTypes = this.availableInputTypes;
        componentInstance.projectLanguages = this.projectLanguages;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.clonedConfigurationDocument = this.clonedConfigurationDocument;
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            editedSubfieldData => {
                this.addSubfield(newSubfieldDefinition, newSubfield);
                this.setEditedSubfieldData(editedSubfieldData, newSubfieldDefinition, newSubfield);
            },
            () => AngularUtility.blurActiveElement()
        );
    }

    
    public async editSubfield(subfieldDefinition: CustomSubfieldDefinition) {

        const [result, componentInstance] = this.modals.make<SubfieldEditorModalComponent>(
            SubfieldEditorModalComponent,
            MenuContext.CONFIGURATION_SUBFIELD_EDIT,
            undefined,
            'subfield-editor-modal'
        );

        const clonedSubfield: Subfield = this.getClonedSubfield(subfieldDefinition);

        componentInstance.subfield = clonedSubfield;
        componentInstance.parentField = this.clonedField;
        componentInstance.category = this.category;
        componentInstance.references = subfieldDefinition.references;
        componentInstance.subfields = this.clonedField.subfields;
        componentInstance.availableInputTypes = this.availableInputTypes;
        componentInstance.projectLanguages = this.projectLanguages;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.clonedConfigurationDocument = this.clonedConfigurationDocument;
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            editedSubfieldData => this.setEditedSubfieldData(editedSubfieldData, subfieldDefinition, clonedSubfield),
            () => AngularUtility.blurActiveElement()
        );
    }


    public deleteSubfield(subfieldToDelete: CustomSubfieldDefinition) {

        this.clonedFieldDefinition.subfields = this.clonedFieldDefinition.subfields.filter(
            subfield => subfield.name !== subfieldToDelete.name
        );
        this.clonedField.subfields = this.clonedField.subfields.filter(
            subfield => subfield.name !== subfieldToDelete.name
        );
    }


    public onDropSubfield(event: CdkDragDrop<any>) {

        InPlace.moveInArray(this.clonedFieldDefinition.subfields, event.previousIndex, event.currentIndex);
    }


    private addSubfield(newSubfieldDefinition: CustomSubfieldDefinition, newSubfield: Subfield) {

        if (!this.clonedField.subfields) this.clonedField.subfields = [];
        this.clonedField.subfields.push(newSubfield);
        this.clonedFieldDefinition.subfields.push(newSubfieldDefinition);
    }


    private setEditedSubfieldData(editedSubfieldData: SubfieldEditorData, subfieldDefinition: CustomSubfieldDefinition,
                                  clonedSubfield: Subfield) {

        subfieldDefinition.inputType = editedSubfieldData.inputType;
        clonedSubfield.inputType = editedSubfieldData.inputType;

        if (editedSubfieldData.references.length > 0) {
            subfieldDefinition.references = editedSubfieldData.references;
        } else {
            delete subfieldDefinition.references;
        }

        if (SubfieldsSectionComponent.isValidSubfieldCondition(editedSubfieldData.condition)) {
            subfieldDefinition.condition = editedSubfieldData.condition;
            clonedSubfield.condition = editedSubfieldData.condition;
        } else {
            delete subfieldDefinition.condition;
            delete clonedSubfield.condition;
        }

        this.setValuelistForEditedSubfield(editedSubfieldData, subfieldDefinition, clonedSubfield);
        this.setLabelsForEditedSubfield(editedSubfieldData, subfieldDefinition, clonedSubfield);
    }


    private setValuelistForEditedSubfield(editedSubfieldData: SubfieldEditorData,
                                          subfieldDefinition: CustomSubfieldDefinition, clonedSubfield: Subfield) {

        if (!this.clonedFormDefinition.valuelists) this.clonedFormDefinition.valuelists = {};

        const valuelists: Valuelists = this.clonedFormDefinition.valuelists;
        if (editedSubfieldData.valuelist) {
            if (!valuelists[this.clonedField.name]
                    || isString(valuelists[this.clonedField.name])) {
                valuelists[this.clonedField.name] = {};
            }
            valuelists[this.clonedField.name][subfieldDefinition.name] = editedSubfieldData.valuelist.id;
        } else if (valuelists[this.clonedField.name]?.[subfieldDefinition.name]) {
            delete valuelists[this.clonedField.name][subfieldDefinition.name];
            if (isEmpty(valuelists[this.clonedField.name])) {
                delete valuelists[this.clonedField.name];
            }
        }

        clonedSubfield.valuelist = editedSubfieldData.valuelist;
    }


    private setLabelsForEditedSubfield(editedSubfieldData: SubfieldEditorData,
                                       subfieldDefinition: CustomSubfieldDefinition, clonedSubfield: Subfield) {

        clonedSubfield.label = editedSubfieldData.label;
        clonedSubfield.description = editedSubfieldData.description;
        
        if (!this.subfieldI18nStrings[subfieldDefinition.name]) this.subfieldI18nStrings[subfieldDefinition.name] = {};
        this.subfieldI18nStrings[subfieldDefinition.name] = {
            label: editedSubfieldData.label,
            description: editedSubfieldData.description
        };
    }


    private getClonedSubfield(subfieldDefinition: CustomSubfieldDefinition): Subfield {

        return this.clonedField.subfields.find(clonedSubfield => {
            return clonedSubfield.name === subfieldDefinition.name;
        });
    }


    private static isValidSubfieldCondition(condition: SubfieldCondition): boolean {

        return condition
            && condition.subfieldName
            && (condition.values === true
                || condition.values === false
                || isArray(condition.values) && condition.values.length > 0
            );
    }
}

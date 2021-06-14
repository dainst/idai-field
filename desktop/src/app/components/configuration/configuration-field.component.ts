import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone, flatten, to } from 'tsfun';
import { Category, CustomFieldDefinition, FieldDefinition, I18nString, LabelUtil, LanguageConfiguration, ValuelistDefinition,
    ValuelistUtil } from 'idai-field-core';
import { OVERRIDE_VISIBLE_FIELDS } from './configuration-category.component';
import { LanguageConfigurationUtil } from '../../core/configuration/language-configuration-util';

const locale: string = typeof window !== 'undefined'
    ? window.require('@electron/remote').getGlobal('config').locale
    : 'de';


type InputType = {
    name: string;
    label: string;
};


@Component({
    selector: 'configuration-field',
    templateUrl: './configuration-field.html'
})
/**
* @author Sebastian Cuy
* @author Thomas Kleinke
 */
export class ConfigurationFieldComponent implements OnChanges {

    @Input() category: Category;
    @Input() field: FieldDefinition;
    @Input() customFieldDefinition: CustomFieldDefinition | undefined;
    @Input() customLanguageConfigurations: { [language: string]: LanguageConfiguration };
    @Input() hidden: boolean;

    @Output() onToggleHidden: EventEmitter<void> = new EventEmitter();

    public parentField: boolean = false;
    public customFieldDefinitionClone: CustomFieldDefinition | undefined;
    public editable: boolean = false;
    public hideable: boolean = false;
    public editing: boolean = false;

    public label: string;
    public description: string;

    public editableLabel: I18nString;
    public editableDescription: I18nString;

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
    ];


    constructor(private i18n: I18n) {}


    ngOnChanges() {

        if (!this.category || !this.field) return;

        this.parentField = this.isParentField();
        this.hideable = this.isHideable();
        this.editing = false;

        this.updateLabelAndDescription();

        this.customFieldDefinitionClone = this.customFieldDefinition
            ? clone(this.customFieldDefinition)
            : undefined;
    }


    public getValuelistDescription = (valuelist: ValuelistDefinition) => valuelist.description?.[locale];

    public getValues = (valuelist: ValuelistDefinition) => ValuelistUtil.getOrderedValues(valuelist);

    public getValueLabel = (valuelist: ValuelistDefinition, valueId: string) =>
        ValuelistUtil.getValueLabel(valuelist, valueId);

    public toggleHidden = () => this.onToggleHidden.emit();

    public isCustomField = () => this.field.source === 'custom';


    public startEditing() {

        this.editableLabel = LanguageConfigurationUtil.mergeCustomAndDefaultTranslations(
            this.customLanguageConfigurations, 'label', this.category, this.field
        );
        this.editableDescription = LanguageConfigurationUtil.mergeCustomAndDefaultTranslations(
            this.customLanguageConfigurations, 'description', this.category, this.field
        );
        this.editing = true;
    }


    public finishEditing() {

        this.updateCustomFieldDefinition();
        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            this.customLanguageConfigurations, this.editableLabel, this.editableDescription, this.category, this.field
        );
        this.updateLabelAndDescription();
        this.editing = false;
    }


    public getInputTypeLabel(): string {

        return this.availableInputTypes.find(inputType => inputType.name === this.getInputType()).label;
    }


    public getInputType() {

        return this.customFieldDefinition
            ? this.editing
                ? this.customFieldDefinitionClone.inputType
                : this.customFieldDefinition.inputType
            : this.field.inputType;
    }


    public setInputType(newInputType: string) {

        if (!this.customFieldDefinitionClone) throw 'Custom field definition is missing!';

        this.customFieldDefinitionClone.inputType = newInputType;
    }


    private updateCustomFieldDefinition() {
        
        if (!this.customFieldDefinition) return;

        this.customFieldDefinition.inputType = this.customFieldDefinitionClone.inputType;
    }


    private updateLabelAndDescription() {

        const { label, description } = LabelUtil.getLabelAndDescription(
            LanguageConfigurationUtil.getUpdatedDefinition(
                this.customLanguageConfigurations, this.category, this.field
            )
        );
        this.label = label;
        this.description = description;
    }
                                    

    private isParentField(): boolean {

        if (!this.category.parentCategory) return false;

        return flatten(this.category.parentCategory.groups.map(to('fields')))
            .map(to('name'))
            .includes(this.field.name);
    }


    private isHideable(): boolean {

        return !this.parentField
            && !OVERRIDE_VISIBLE_FIELDS.includes(this.field.name)
            && this.field.source !== 'custom';
    }
}

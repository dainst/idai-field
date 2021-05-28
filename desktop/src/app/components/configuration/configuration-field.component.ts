import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone, flatten, to } from 'tsfun';
import { Category, CustomFieldDefinition, FieldDefinition, I18nString, LabelUtil, LanguageConfiguration, ValuelistDefinition,
    ValuelistUtil } from 'idai-field-core';
import { OVERRIDE_VISIBLE_FIELDS } from './project-configuration.component';

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


    constructor(private i18n: I18n) {}


    ngOnChanges() {

        if (!this.category || !this.field) return;

        this.parentField = this.isParentField();
        this.editable = this.isEditable();
        this.hideable = this.isHideable();
        this.editing = false;

        const { label, description } = LabelUtil.getLabelAndDescription(this.field);
        this.label = label;
        this.description = description;

        this.customFieldDefinitionClone = this.customFieldDefinition
            ? clone(this.customFieldDefinition)
            : undefined;
    }


    public getValuelistDescription = (valuelist: ValuelistDefinition) => valuelist.description?.[locale];

    public getValues = (valuelist: ValuelistDefinition) => ValuelistUtil.getOrderedValues(valuelist);

    public getValueLabel = (valuelist: ValuelistDefinition, valueId: string) =>
        ValuelistUtil.getValueLabel(valuelist, valueId);

    public toggleHidden = () => this.onToggleHidden.emit();


    public startEditing() {

        this.editableLabel = this.createEditableI18nString('label');
        this.editableDescription = this.createEditableI18nString('description');
        this.editing = true;
    }


    public finishEditing() {

        this.updateCustomFieldDefinition();
        this.updateCustomLanguageConfigurations();
        this.editing = false;
    }


    public getAvailableInputTypes(): Array<InputType> {

        return [
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
    }


    public getInputTypeLabel(): string {

        return this.getAvailableInputTypes().find(inputType => inputType.name === this.getInputType()).label;
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


    private createEditableI18nString(type: 'label'|'description'): I18nString {

        return Object.keys(this.customLanguageConfigurations).reduce((result: I18nString, languageCode: string) => {
            const translation = this.customLanguageConfigurations[languageCode]
                ?.categories?.[this.category.name]
                ?.fields?.[this.field.name]?.[type];
            if (translation) result[languageCode] = translation;
            return result;
        }, this.field[type] ? clone(this.field[type]) : {});
    }


    private updateCustomFieldDefinition() {
        
        this.customFieldDefinition.inputType = this.customFieldDefinitionClone.inputType;
    }


    private updateCustomLanguageConfigurations() {

        Object.keys(this.editableLabel).forEach(languageCode => {
            this.updateCustomLanguageConfigurationSection(
                'label', this.editableLabel[languageCode], languageCode
            );
        });

        Object.keys(this.editableDescription).forEach(languageCode => {
            this.updateCustomLanguageConfigurationSection(
                'description', this.editableDescription[languageCode], languageCode
            );
        });
    }


    private updateCustomLanguageConfigurationSection(sectionName: 'label'|'description', newText: string,
                                                     languageCode: string) {

            // TODO Do not add if the same label is set in library/core configuration
            this.addToCustomLanguageConfigurationSection(sectionName, newText, languageCode);
    }


    private addToCustomLanguageConfigurationSection(sectionName: 'label'|'description', newText: string,
                                                    languageCode: string) {

        if (!this.customLanguageConfigurations[languageCode]) {
            this.customLanguageConfigurations[languageCode] = {};
        }
        const languageConfiguration = this.customLanguageConfigurations[languageCode];
        
        if (!languageConfiguration.categories) languageConfiguration.categories = {};
        if (!languageConfiguration.categories[this.category.name]) {
            languageConfiguration.categories[this.category.name] = {};
        }
        const categoryConfiguration = languageConfiguration.categories[this.category.name];

        if (!categoryConfiguration.fields) categoryConfiguration.fields = {};
        if (!categoryConfiguration.fields[this.field.name]) {
            categoryConfiguration.fields[this.field.name] = {};
        }
        const fieldConfiguration = categoryConfiguration.fields[this.field.name];
        
        fieldConfiguration[sectionName] = newText;
    }
                                    

    private isParentField(): boolean {

        if (!this.category.parentCategory) return false;

        return flatten(this.category.parentCategory.groups.map(to('fields')))
            .map(to('name'))
            .includes(this.field.name);
    }


    private isEditable(): boolean {

        return !this.parentField
            && !OVERRIDE_VISIBLE_FIELDS.includes(this.field.name)
            && this.field.source === 'custom';
    }


    private isHideable(): boolean {

        return !this.parentField
            && !OVERRIDE_VISIBLE_FIELDS.includes(this.field.name)
            && this.field.source !== 'custom';
    }
}

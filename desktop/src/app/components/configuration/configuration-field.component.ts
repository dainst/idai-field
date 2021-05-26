import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Category, CustomFieldDefinition, FieldDefinition, LabelUtil, ValuelistDefinition,
    ValuelistUtil } from 'idai-field-core';
import { clone, flatten, to } from 'tsfun';
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
    @Input() hidden: boolean;

    @Output() onToggleHidden: EventEmitter<void> = new EventEmitter();

    public parentField: boolean = false;
    public customFieldDefinitionClone: CustomFieldDefinition | undefined;
    public editable: boolean = false;
    public hideable: boolean = false;
    public editing: boolean = false;


    constructor(private i18n: I18n) {}


    public getLabel = () => LabelUtil.getTranslation(this.field.label);
    public getDescription = () => LabelUtil.getTranslation(this.field.description);


    ngOnChanges() {

        if (!this.category || !this.field) return;

        this.parentField = this.isParentField();
        this.editable = this.isEditable();
        this.hideable = this.isHideable();
        this.editing = false;
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

        this.editing = true;
    }


    public finishEditing() {

        this.customFieldDefinition.inputType = this.customFieldDefinitionClone.inputType;
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

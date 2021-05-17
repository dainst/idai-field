import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { flatten, to } from 'tsfun';
import { Category, CustomFieldDefinition, FieldDefinition, ValuelistDefinition } from 'idai-field-core';
import { ValuelistUtil } from '../../core/util/valuelist-util';
import { OVERRIDE_VISIBLE_FIELDS } from './project-configuration.component';

const locale: string = typeof window !== 'undefined'
    ? window.require('@electron/remote').getGlobal('config').locale
    : 'de';


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
    public editable: boolean = false;
    public hideable: boolean = false;
    public editing: boolean = false;


    constructor() {}


    ngOnChanges() {

        if (!this.category || !this.field) return;

        this.parentField = this.isParentField();
        this.editable = this.isEditable();
        this.hideable = this.isHideable();
        this.editing = false;
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

        this.editing = false;
    }


    public getInputType() {


        return this.customFieldDefinition
            ? this.customFieldDefinition.inputType
            : this.field.inputType;
    }


    public setInputType(newInputType: string) {

        if (!this.customFieldDefinition) throw 'Custom field definiton is missing!';

        this.customFieldDefinition.inputType = newInputType;
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

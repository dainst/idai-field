import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Category, ConfigurationDocument, CustomFieldDefinition, FieldDefinition, ValuelistDefinition,
    ValuelistUtil, LabelUtil } from 'idai-field-core';
import { InputType } from './project-configuration.component';
import { ConfigurationUtil } from '../../core/configuration/configuration-util';
import { ConfigurationContextMenu } from './context-menu/configuration-context-menu';


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
    @Input() customConfigurationDocument: ConfigurationDocument;
    @Input() hidden: boolean;
    @Input() availableInputTypes: Array<InputType>;
    @Input() contextMenu: ConfigurationContextMenu;

    @Output() onEdit: EventEmitter<void> = new EventEmitter<void>();

    public parentField: boolean = false;
    public customFieldDefinitionClone: CustomFieldDefinition | undefined;
    public editable: boolean = false;

    public label: string;
    public description: string;


    constructor(private i18n: I18n) {}


    ngOnChanges() {

        if (!this.category || !this.field) return;

        this.parentField = ConfigurationUtil.isParentField(this.category, this.field);
        this.updateLabelAndDescription();
    }


    public getValuelistDescription = (valuelist: ValuelistDefinition) => valuelist.description?.[locale];

    public getValues = (valuelist: ValuelistDefinition) => ValuelistUtil.getOrderedValues(valuelist);

    public getValueLabel = (valuelist: ValuelistDefinition, valueId: string) =>
        ValuelistUtil.getValueLabel(valuelist, valueId);

    public getCustomLanguageConfigurations = () => this.customConfigurationDocument.resource.languages;

    public isCustomField = () => this.field.source === 'custom';


    public getCustomFieldDefinition(): CustomFieldDefinition|undefined {

        return this.customConfigurationDocument.resource
            .categories[this.category.libraryId ?? this.category.name]
            .fields[this.field.name];
    }


    public getInputTypeLabel(): string {

        return this.availableInputTypes
            .find(inputType => inputType.name === this.field.inputType)
            .label;
    }


    private updateLabelAndDescription() {

        const { label, description } = LabelUtil.getLabelAndDescription(this.field);
        this.label = label;
        this.description = description;
    }
}

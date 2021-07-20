import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Category, ConfigurationDocument, CustomFieldDefinition, Field, Valuelist,
    Labels } from 'idai-field-core';
import { InputType } from './configuration.component';
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
    @Input() field: Field;
    @Input() configurationDocument: ConfigurationDocument;
    @Input() hidden: boolean;
    @Input() availableInputTypes: Array<InputType>;
    @Input() contextMenu: ConfigurationContextMenu;
    @Input() opened: boolean = false;

    @Output() onEdit: EventEmitter<void> = new EventEmitter<void>();
    @Output() onOpen: EventEmitter<void> = new EventEmitter<void>();

    public parentField: boolean = false;
    public customFieldDefinitionClone: CustomFieldDefinition | undefined;
    public editable: boolean = false;

    public label: string;
    public description: string;


    constructor(private labels: Labels) {}


    ngOnChanges() {

        if (!this.category || !this.field) return;

        this.parentField = ConfigurationUtil.isParentField(this.category, this.field);
        this.updateLabelAndDescription();
    }


    public getValuelistDescription = (valuelist: Valuelist) => valuelist.description?.[locale];

    public getValues = (valuelist: Valuelist) => this.labels.orderKeysByLabels(valuelist);

    public getValueLabel = (valuelist: Valuelist, valueId: string) =>
        this.labels.getValueLabel(valuelist, valueId);

    public getCustomLanguageConfigurations = () => this.configurationDocument.resource.languages;

    public isCustomField = () => this.field.source === 'custom';


    public getCustomFieldDefinition(): CustomFieldDefinition|undefined {

        return this.configurationDocument.resource
            .categories[this.category.libraryId ?? this.category.name]
            .fields[this.field.name];
    }


    public getInputTypeLabel(): string {

        return this.availableInputTypes
            .find(inputType => inputType.name === this.field.inputType)
            .label;
    }


    private updateLabelAndDescription() {

        const { label, description } = this.labels.getLabelAndDescription(this.field);
        this.label = label;
        this.description = description;
    }
}

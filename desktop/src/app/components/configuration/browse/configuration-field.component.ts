import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { isArray } from 'tsfun';
import { CategoryForm, Condition, ConfigurationDocument, CustomFieldDefinition, Datastore, Field, Labels,
    ProjectConfiguration, Relation, Valuelist, ValuelistUtil } from 'idai-field-core';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import { ConfigurationUtil, InputType } from '../configuration-util';
import { ConfigurationContextMenu } from '../context-menu/configuration-context-menu';
import { UtilTranslations } from '../../../util/util-translations';
import { getInputTypeLabel } from '../../../util/get-input-type-label';


@Component({
    selector: 'configuration-field',
    templateUrl: './configuration-field.html',
    standalone: false
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ConfigurationFieldComponent implements OnChanges {

    @Input() category: CategoryForm;
    @Input() field: Field;
    @Input() configurationDocument: ConfigurationDocument;
    @Input() clonedProjectConfiguration: ProjectConfiguration;
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

    private conditionFieldValuelist: Valuelist;


    constructor(private labels: Labels,
                private utilTranslations: UtilTranslations,
                private settingsProvider: SettingsProvider,
                private datastore: Datastore) {}


    public getFieldId = () => 'field-' + this.field.name.replace(':', '-');

    public getInputTypeLabel = () => getInputTypeLabel(
        this.field.inputType, this.utilTranslations
    );
    
    public getCategoryLabel = (categoryName: string) => this.labels.get(
        this.clonedProjectConfiguration.getCategory(categoryName)
    );

    public getFieldLabel = (fieldName: string) => this.labels.get(
        CategoryForm.getField(this.category, fieldName)
    );

    public getRelationLabel = (relationName: string) => this.labels.getRelationLabel(
        relationName, this.clonedProjectConfiguration.getRelations()
    );

    public getInverseRelation = () => (this.field as Relation).inverse;

    public getDateDataType = () => this.field.dateConfiguration?.dataType;

    public getDateInputMode = () => this.field.dateConfiguration?.inputMode;

    public getCustomLanguageConfigurations = () => this.configurationDocument.resource.languages;

    public highlightAsCustomField = () => this.settingsProvider.getSettings().highlightCustomElements
        && this.field.source === 'custom'
        && (this.parentField
            ? this.category.parentCategory.customFields?.includes(this.field.name)
            : this.category.customFields?.includes(this.field.name)
        );

    public isContextMenuOpen = () => this.contextMenu.isOpen() && this.contextMenu.field === this.field;


    async ngOnChanges() {

        if (!this.category || !this.field) return;

        this.parentField = ConfigurationUtil.isParentField(this.category, this.field);
        this.updateLabelAndDescription();
        await this.updateConditionFieldValuelist();
    }


    public getCustomFieldDefinition(): CustomFieldDefinition|undefined {

        return this.configurationDocument.resource
            .forms[this.category.libraryId ?? this.category.name]
            .fields[this.field.name];
    }


    public getRange(): string[] {
        
        const range: string[] = (this.field as Relation).range;
        
        return range?.filter(categoryName => {
            const parentCategory = this.clonedProjectConfiguration.getCategory(categoryName).parentCategory;
            return !parentCategory || !range.includes(parentCategory.name);
        });
    }


    public getConditionValuesLabel(): string {

        return Condition.generateLabel(
            this.field.condition,
            key => this.utilTranslations.getTranslation(key),
            valueId => this.labels.getValueLabel(this.conditionFieldValuelist, valueId)
        );
    }


    private updateLabelAndDescription() {

        const { label, description } = this.labels.getLabelAndDescription(this.field);
        this.label = label;
        this.description = description;
    }

    
    private async updateConditionFieldValuelist() {

        if (!this.field.condition || !isArray(this.field.condition.values)) return;

        this.conditionFieldValuelist = ValuelistUtil.getValuelist(
            CategoryForm.getField(this.category, this.field.condition.fieldName),
            await this.datastore.get('project')
        );
    }
}

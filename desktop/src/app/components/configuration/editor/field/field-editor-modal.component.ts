import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { clone, equal, intersection, isArray, isEmpty, Map, set, subsetOf, to } from 'tsfun';
import { ConfigurationDocument, CustomFormDefinition, Field, I18N, OVERRIDE_VISIBLE_FIELDS,
    CustomLanguageConfigurations, ProjectConfiguration, CategoryForm, Named, Labels, 
    CustomFieldDefinition, DateConfiguration, Condition, Relation } from 'idai-field-core';
import { InputType, ConfigurationUtil } from '../../configuration-util';
import { ConfigurationEditorModalComponent } from '../configuration-editor-modal.component';
import { Menus } from '../../../../services/menus';
import { Messages } from '../../../messages/messages';
import { Modals } from '../../../../services/modals';
import { M } from '../../../messages/m';


@Component({
    templateUrl: './field-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class FieldEditorModalComponent extends ConfigurationEditorModalComponent {

    public field: Field|undefined;
    public groupName: string;
    public availableInputTypes: Array<InputType>;
    public permanentlyHiddenFields: string[];
    public clonedProjectConfiguration: ProjectConfiguration;

    public clonedField: Field|undefined;
    public hideable: boolean;
    public hidden: boolean;
    public condition: Condition;
    public i18nCompatible: boolean;
    public subfieldI18nStrings: Map<{ label?: I18N.String, description?: I18N.String }>;
    public dragging: boolean;
    public selectableTargetCategories: Array<CategoryForm>;
    public selectedTargetCategoryNames: string[];
    public availableInverseRelations: string[];

    private inverseRelation: string|undefined;

    protected changeMessage = $localize `:@@configuration.fieldChanged:Das Feld wurde geändert.`;


    constructor(activeModal: NgbActiveModal,
                modals: Modals,
                menuService: Menus,
                messages: Messages,
                private labels: Labels) {

        super(activeModal, modals, menuService, messages);
    }


    public getCustomFieldDefinition = () => this.getCustomFormDefinition().fields[this.field.name];

    public getClonedFieldDefinition = () => this.getClonedFormDefinition().fields[this.field.name];

    public isMandatory = () => this.getClonedFieldDefinition()?.mandatory ?? this.field.required;

    public isMandatoryOptionVisible = () => this.field.editable;

    public isMandatoryOptionEnabled = () => !this.field.required
        && !Field.InputType.RELATION_INPUT_TYPES.includes(this.getInputType());

    public getDateConfiguration = () => this.getClonedFieldDefinition().dateConfiguration

    public isConditionSectionVisible = () => !this.isMandatory() && !OVERRIDE_VISIBLE_FIELDS.includes(this.field.name)
        && this.field.name !== 'category';

    public isValuelistSectionVisible = () => Field.InputType.VALUELIST_INPUT_TYPES.includes(
        this.getClonedFieldDefinition()?.inputType as Field.InputType ?? this.field.inputType
    ) && !this.field.valuelistFromProjectField;

    public isDateSectionVisible = () => this.getInputType() === Field.InputType.DATE;

    public isSubfieldsSectionVisible = () => this.getInputType() === Field.InputType.COMPOSITE;

    public isRelationSectionVisible = () => this.getInputType() === Field.InputType.RELATION
        && (this.isCustomField() || Relation.Workflow.ALL.includes(this.field.name));

    public isInverseRelationVisible = () => this.isRelationSectionVisible() && this.isCustomField();

    public isI18nCompatible = () => Field.InputType.I18N_COMPATIBLE_INPUT_TYPES.includes(this.getInputType());

    public isCustomField = () => this.field.source === 'custom';

    public getAvailableConditionFields = () => CategoryForm.getFields(this.category);


    public initialize() {

        super.initialize();

        this.selectableTargetCategories = this.getSelectableTargetCategories();

        if (this.new) {
            
            const newFieldDefinition: CustomFieldDefinition = {
                inputType: this.field.inputType,
            };
            if (this.availableInputTypes.find(inputType => inputType.name === this.field.inputType)?.searchable) {
                newFieldDefinition.constraintIndexed = false;
            }
            this.getClonedFormDefinition().fields[this.field.name] = newFieldDefinition;
            this.clonedConfigurationDocument = ConfigurationDocument.addField(
                this.clonedConfigurationDocument, this.category, this.permanentlyHiddenFields,
                this.groupName, this.field.name
            );
        } else if (!this.getClonedFieldDefinition()) {
            this.getClonedFormDefinition().fields[this.field.name] = {};
        }

        if (!this.getClonedFieldDefinition().references) this.getClonedFieldDefinition().references = [];
        if (!this.getClonedFieldDefinition().subfields) this.getClonedFieldDefinition().subfields = [];
        if (!this.getClonedFieldDefinition().condition) {
            this.getClonedFieldDefinition().condition = Condition.getEmpty('field');
        }

        this.clonedField = clone(this.field);

        this.hideable = this.isHideable();
        this.hidden = this.isHidden();
        this.inverseRelation = this.getClonedFieldDefinition().inverse;

        this.subfieldI18nStrings = this.field.subfields?.reduce((result, subfield) => {
            result[subfield.name] = { label: subfield.label, description: subfield.description };
            return result;
        }, {}) ?? {};

        this.initializeDateConfiguration();
        this.initializeSelectedTargetCategories();
        this.updateAvailableInverseRelations();
    }


    public async confirm() {

        try {
            this.assertChangesAreValid();
            ConfigurationUtil.cleanUpAndValidateReferences(this.getClonedFieldDefinition());
        } catch (errWithParams) {
            return this.messages.add(errWithParams);
        }

        if (this.isMandatory() || !Condition.isValid(this.getClonedFieldDefinition().condition, 'field')) {
            delete this.getClonedFieldDefinition().condition;
        }

        if (!this.isDateSectionVisible()) {
            delete this.getClonedFieldDefinition().dateConfiguration;
        }

        if (!this.isSubfieldsSectionVisible()) {
            delete this.getClonedFieldDefinition().subfields;
            Object.keys(this.subfieldI18nStrings).forEach(subfieldName => {
                this.subfieldI18nStrings[subfieldName] = {};
            });
        }

        if (this.getCustomFieldDefinition()?.inverse) this.deleteInverseRelations();

        if (this.isRelationSectionVisible()) {
            this.getClonedFieldDefinition().range = this.getRange();
            if (this.inverseRelation) {
                this.getClonedFieldDefinition().inverse = this.inverseRelation;
                this.updateInverseRelations();
            } else {
                delete this.getClonedFieldDefinition().inverse
            }
        } else {
            delete this.getClonedFieldDefinition().range;
            delete this.getClonedFieldDefinition().inverse;
        }

        if (isEmpty(this.getClonedFieldDefinition())) {
            delete this.getClonedFormDefinition().fields[this.field.name];
        }

        await super.confirm(true);
    }


    public getInputType(): Field.InputType {

        return this.getClonedFieldDefinition()?.inputType as Field.InputType
            ?? this.field.inputType as Field.InputType;
    }


    public setInputType(newInputType: Field.InputType) {

        if (this.getClonedFormDefinition().valuelists
                && !(Field.InputType.VALUELIST_INPUT_TYPES.includes(this.getInputType())
                    && Field.InputType.VALUELIST_INPUT_TYPES.includes(newInputType))) {
            delete this.getClonedFormDefinition().valuelists[this.field.name];
            delete this.clonedField.valuelist;
        }

        if (!this.availableInputTypes.find(inputType => inputType.name === newInputType).searchable) {
            delete this.getClonedFieldDefinition().constraintIndexed;
        }

        if (newInputType === this.field.inputType && !this.getCustomFieldDefinition()?.inputType) {
            delete this.getClonedFieldDefinition().inputType;
            this.clonedField.inputType = this.field.inputType;
            if (this.getCustomFieldDefinition()?.constraintIndexed) {
                this.getClonedFieldDefinition().constraintIndexed = this.field.constraintIndexed;
            }
        } else {
            this.getClonedFieldDefinition().inputType = newInputType;
            this.clonedField.inputType = newInputType;
        }

        if (Field.InputType.RELATION_INPUT_TYPES.includes(newInputType)) {
            delete this.getClonedFieldDefinition().mandatory;
        }

        this.initializeDateConfiguration();
    }


    public toggleMandatory() {

        const clonedFieldDefinition: CustomFieldDefinition = this.getClonedFieldDefinition();
        if (this.isMandatory()) {
            delete clonedFieldDefinition.mandatory;
        } else {
            clonedFieldDefinition.mandatory = true;
        }
    }


    public toggleHidden() {

        const customFormDefinition: CustomFormDefinition = this.getClonedFormDefinition();

        if (this.hidden) {
            customFormDefinition.hidden
                = customFormDefinition.hidden.filter(name => name !== this.field.name);
        } else {
            if (!customFormDefinition.hidden) customFormDefinition.hidden = [];
            customFormDefinition.hidden.push(this.field.name);
        }

        this.hidden = this.isHidden();
    }


    public toggleConstraintIndexed() {

        if (this.field.defaultConstraintIndexed === undefined) {
            this.getClonedFieldDefinition().constraintIndexed = !this.getClonedFieldDefinition().constraintIndexed;
        } else if (this.getClonedFieldDefinition().constraintIndexed === undefined) {
            this.getClonedFieldDefinition().constraintIndexed = !this.field.defaultConstraintIndexed;
        } else {
            delete this.getClonedFieldDefinition().constraintIndexed;
        }
    }


    public isConstraintIndexed() {

        return this.getClonedFieldDefinition()?.constraintIndexed
            || (this.getClonedFieldDefinition()?.constraintIndexed !== false && this.field.constraintIndexed);
    }


    public isConstraintIndexOptionEnabled(): boolean {

        return this.category.name !== 'Project'
            && this.availableInputTypes.find(inputType => inputType.name === this.getInputType()).searchable;
    }


    public getMandatoryTooltip(): string {

        if (this.field.required) {
             return $localize `:@@configuration.mandatoryField.notAllowedForRequiredField:Dieses Feld ist grundsätzlich ein Pflichtfeld.`;
         } else if (Field.InputType.RELATION_INPUT_TYPES.includes(this.getInputType())) {
             return $localize `:@@configuration.mandatoryField.notAllowedForInputType:Felder dieses Eingabetyps können nicht als Pflichtfeld konfiguriert werden.`;
         } else {
             return '';
         }
     }


    public getConstraintIndexedTooltip(): string {

       if (this.category.name === 'Project') {
            return $localize `:@@configuration.fieldSpecificSearch.notAllowedForProjectFields:Eine feldspezifische Suche ist für Felder der Projekt-Kategorie nicht möglich.`;
        } else if (!this.availableInputTypes.find(inputType => inputType.name === this.getInputType()).searchable) {
            return $localize `:@@configuration.fieldSpecificSearch.notAllowedForInputType:Eine feldspezifische Suche ist für Felder dieses Eingabetyps nicht möglich.`;
        } else {
            return '';
        }
    }


    public getRelationLabel(relationName: string) {

        if (relationName === this.field.name) {
            const label: string = this.labels.getFromI18NString(this.clonedLabel);
            return label?.length ? label : relationName;
        } else {
            return this.labels.getRelationLabel(relationName, this.clonedProjectConfiguration.getRelations());
        }
    }


    public toggleTargetCategory(category: CategoryForm) {
        
        if (this.selectedTargetCategoryNames.includes(category.name)) {
            this.selectedTargetCategoryNames = this.selectedTargetCategoryNames.filter(categoryName => {
                return categoryName != category.name
                    && this.clonedProjectConfiguration.getCategory(categoryName).parentCategory?.name !== category.name
                    && category.parentCategory?.name !== categoryName;
            });
        } else {
            const categoryNames: string[] = [category].concat(category.children).map(to(Named.NAME));
            this.selectedTargetCategoryNames = set(this.selectedTargetCategoryNames.concat(categoryNames));
        }

        this.updateAvailableInverseRelations();
    }


    public setInverseRelation(relationName: string) {

        this.inverseRelation = relationName?.length ? relationName : undefined;
    }


    public isSelectedInverseRelation(relationName: string) {

        return this.inverseRelation === relationName;
    }


    public setDateDataType(value: DateConfiguration.DataType) {

        this.getClonedFieldDefinition().dateConfiguration.dataType = value;
    }


    public setDateInputMode(value: DateConfiguration.InputMode) {

        this.getClonedFieldDefinition().dateConfiguration.inputMode = value;
    }


    public isChanged(): boolean {

        return this.new
            || this.getCustomFieldDefinition()?.inputType !== this.getClonedFieldDefinition()?.inputType
            || this.getCustomFieldDefinition()?.mandatory !== this.getClonedFieldDefinition()?.mandatory
            || !equal(this.getCustomFormDefinition().hidden)(this.getClonedFormDefinition().hidden)
            || this.isValuelistChanged()
            || this.isConstraintIndexedChanged()
            || this.isConditionChanged()
            || this.isDateConfigurationChanged()
            || this.isSubfieldsChanged()
            || !equal(this.getCustomFieldDefinition()?.range ?? [], this.getRange())
            || this.getCustomFieldDefinition()?.inverse !== this.inverseRelation
            || !equal(this.label)(I18N.removeEmpty(this.clonedLabel))
            || !equal(this.description ?? {})(I18N.removeEmpty(this.clonedDescription))
            || (this.isCustomField() && ConfigurationUtil.isReferencesArrayChanged(this.getCustomFieldDefinition(),
                    this.getClonedFieldDefinition()));
    }


    private isValuelistChanged(): boolean {

        return !equal(this.getCustomFormDefinition().valuelists ?? {})(this.getClonedFormDefinition().valuelists ?? {})
            && this.field.valuelist?.id !== this.getClonedFormDefinition().valuelists[this.field.name];
    }


    private isConstraintIndexedChanged(): boolean {

        return this.getCustomFieldDefinition()?.constraintIndexed !== this.getClonedFieldDefinition()?.constraintIndexed
            || (this.getCustomFieldDefinition()?.constraintIndexed === undefined
                && this.getClonedFieldDefinition()?.constraintIndexed === false)
            || (this.getCustomFieldDefinition()?.constraintIndexed === false
                && this.getClonedFieldDefinition()?.constraintIndexed === undefined);
    }


    private isConditionChanged(): boolean {

        const condition: Condition = Condition.isValid(this.getCustomFieldDefinition()?.condition, 'field')
            ? this.getCustomFieldDefinition().condition
            : Condition.getEmpty('field');

        const clonedCondition: Condition = Condition.isValid(this.getClonedFieldDefinition()?.condition, 'field')
            ? this.getClonedFieldDefinition().condition
            : Condition.getEmpty('field');

        return !equal(condition)(clonedCondition);
    }


    private isDateConfigurationChanged(): boolean {

        if (!this.isDateSectionVisible()) return false;

        const configuration: DateConfiguration = this.getCustomFieldDefinition()?.dateConfiguration
            ?? this.field.dateConfiguration
            ?? DateConfiguration.getDefault();
        const clonedConfiguration: DateConfiguration = this.getClonedFieldDefinition()?.dateConfiguration;

        return !equal(configuration, clonedConfiguration);
    }


    private isSubfieldsChanged(): boolean {

        return !equal(this.getCustomFieldDefinition()?.subfields ?? [],
                      this.getClonedFieldDefinition()?.subfields ?? [])
            || this.isSubfieldsI18nChanged();
    }


    private isSubfieldsI18nChanged(): boolean {

        return this.field.subfields?.filter(subfield => {
            return !equal(subfield.label ?? {})(I18N.removeEmpty(this.subfieldI18nStrings[subfield.name]?.label ?? {}))
                || !equal(subfield.description ?? {})(I18N.removeEmpty(this.subfieldI18nStrings[subfield.name]
                    ?.description ?? {}));
        }).length > 0;
    }


    private initializeDateConfiguration() {

        if (this.isDateSectionVisible() && !this.getClonedFieldDefinition().dateConfiguration) {
            this.getClonedFieldDefinition().dateConfiguration = this.field.dateConfiguration
                ? clone(this.field.dateConfiguration)
                : DateConfiguration.getDefault();
        }
    }


    private initializeSelectedTargetCategories() {

        const range: string[] = this.getClonedFieldDefinition().range ?? [];

        this.selectedTargetCategoryNames = range.reduce((result, categoryName) => {
            const category: CategoryForm = this.clonedProjectConfiguration.getCategory(categoryName);
            return result.concat([categoryName])
                .concat(category.children.map(to(Named.NAME)));
        }, []);
    }


    private getRange(): string[] {

        const result: string[] = this.selectedTargetCategoryNames.filter(categoryName => {
            const parentCategory: CategoryForm 
                = this.clonedProjectConfiguration.getCategory(categoryName).parentCategory;
            return !parentCategory || !this.selectedTargetCategoryNames.includes(parentCategory.name);
        });

        result.sort();

        return result;
    }


    private updateAvailableInverseRelations() {

        const relationNames: string[][] = this.getRange()
            .map(categoryName => { 
                const category: CategoryForm = this.clonedProjectConfiguration.getCategory(categoryName);
                const formDefinition: CustomFormDefinition = this.getClonedFormDefinition(category);

                return Object.keys(formDefinition.fields)
                    .filter(fieldName => {
                        const fieldDefinition: CustomFieldDefinition = formDefinition.fields[fieldName];
                        return fieldDefinition.inputType === Field.InputType.RELATION
                            && this.isValidInverseRelation(
                                fieldDefinition, categoryName, this.category.name, fieldName
                            );
                    });
            });
        
        this.availableInverseRelations = intersection(relationNames);
        
        if (!this.availableInverseRelations.includes(this.getClonedFieldDefinition().inverse)) {
            delete this.getClonedFieldDefinition().inverse;
        }
    }


    private isValidInverseRelation(relationDefinition: CustomFieldDefinition, domain: string, expectedRange: string,
                                   inverseRelationName: string, inverse: boolean = true,
                                   checkedCategories: Map<string[]> = {}): boolean {

        const range: string[] = relationDefinition === this.getClonedFieldDefinition()
            ? this.getRange()
            : relationDefinition?.range;

        if (!range?.includes(expectedRange)) {
            return false;
        } else {
            if (!checkedCategories[domain]) checkedCategories[domain] = [];
            checkedCategories[domain].push(expectedRange);
            for (let categoryName of range) {
                if (checkedCategories[categoryName]?.includes(domain)) continue;
    
                const category: CategoryForm = this.clonedProjectConfiguration.getCategory(categoryName);
                const relationToCheck: string = inverse ? this.field.name : inverseRelationName;
                const fieldDefinition: CustomFieldDefinition = this.getClonedFormDefinition(category)
                    .fields[relationToCheck];
                if (!this.isValidInverseRelation(
                    fieldDefinition, categoryName, domain, inverseRelationName, !inverse, checkedCategories
                )) return false;
            }
        }

        return true;
    }


    private deleteInverseRelations(categoryNames: string[] = this.getCustomFieldDefinition().range ?? [],
                                   inverse: boolean = false) {
        
        const relationToEdit: string = inverse ? this.field.name : this.getCustomFieldDefinition().inverse;

        categoryNames.forEach(categoryName => {
            const category: CategoryForm = this.clonedProjectConfiguration.getCategory(categoryName);
            const fieldDefinition: CustomFieldDefinition = this.getClonedFormDefinition(category)
                .fields[relationToEdit];
            if (fieldDefinition.inverse) {
                delete fieldDefinition.inverse;
                this.deleteInverseRelations(fieldDefinition.range, !inverse);
            }
        });
    }


    private updateInverseRelations(categoryNames: string[] = this.getRange(), inverse: boolean = false) {

        const relationToEdit: string = inverse ? this.field.name : this.getClonedFieldDefinition().inverse;
        const relationToSet: string = inverse ? this.getClonedFieldDefinition().inverse : this.field.name;

        categoryNames.forEach(categoryName => {
            const category: CategoryForm = this.clonedProjectConfiguration.getCategory(categoryName);
            const fieldDefinition: CustomFieldDefinition = this.getClonedFormDefinition(category)
                .fields[relationToEdit];
            if (fieldDefinition.inverse !== relationToSet) {
                fieldDefinition.inverse = relationToSet;
                this.updateInverseRelations(fieldDefinition.range, !inverse);
            }
        });
    }


    protected getLabel(): I18N.String {

        return this.field.label;
    }


    protected getDescription(): I18N.String {

        return this.field.description;
    }


    protected updateCustomLanguageConfigurations() {

        CustomLanguageConfigurations.update(
            this.getClonedLanguageConfigurations(), this.clonedLabel, this.clonedDescription,
            this.category, this.clonedField
        );

        Object.keys(this.subfieldI18nStrings).forEach(subfieldName => {
            CustomLanguageConfigurations.update(
                this.getClonedLanguageConfigurations(),
                this.subfieldI18nStrings[subfieldName].label ?? {},
                this.subfieldI18nStrings[subfieldName].description ?? {},
                this.category,
                this.clonedField,
                this.clonedField.subfields.find(subfield => subfield.name === subfieldName)
            );
        });
    }


    private assertChangesAreValid() {

        this.assertChangesDoNotViolateConditionalFields();

        if (!this.field.valuelist && this.isValuelistSectionVisible()
                && !this.getClonedFormDefinition().valuelists?.[this.field.name]) {
            throw [M.CONFIGURATION_ERROR_NO_VALUELIST];
        }

        if (this.getClonedFieldDefinition().subfields?.length < 2 && this.isSubfieldsSectionVisible()) {
            throw [M.CONFIGURATION_ERROR_NO_SUBFIELDS];
        }

        if (this.isRelationSectionVisible() && !this.selectedTargetCategoryNames.length) {
            throw [M.CONFIGURATION_ERROR_NO_ALLOWED_TARGET_CATEGORIES];
        }
    }


    private assertChangesDoNotViolateConditionalFields() {

        const conditionalFields: Array<Field> = CategoryForm.getFields(this.category).filter(field => {
            return field.condition?.fieldName === this.field.name;
        });

        const values: string[] = this.clonedField.valuelist
            ? Object.keys(this.clonedField.valuelist.values)
            : [];

        for (let field of conditionalFields) {
            if ((field.condition.values === true || field.condition.values === false)
                    && this.getInputType() !== Field.InputType.BOOLEAN) {
                throw [M.CONFIGURATION_ERROR_FIELD_CONDITION_VIOLATION_INPUT_TYPE, this.labels.get(field)];
            } else if (isArray(field.condition.values)
                && (!Field.InputType.VALUELIST_INPUT_TYPES.includes(this.getInputType())
                        || !subsetOf(values, field.condition.values))) {
                throw [M.CONFIGURATION_ERROR_SUBFIELD_CONDITION_VIOLATION_VALUELISTS, this.labels.get(field)];
            }
        }
    }


    private isHideable(): boolean {

        return !OVERRIDE_VISIBLE_FIELDS.includes(this.field.name)
            && this.field.source !== 'custom'
            && !this.field.required
    }


    private isHidden(): boolean {

        return ConfigurationDocument.isHidden(this.getClonedFormDefinition())(this.field);
    }


    private getSelectableTargetCategories(): Array<CategoryForm> {

        return this.clonedProjectConfiguration.getTopLevelCategories()
            .filter(category => category.name !== 'Project');
    }
}

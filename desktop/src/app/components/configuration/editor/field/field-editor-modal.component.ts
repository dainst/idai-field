import { Component } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone, equal, isEmpty, nop, Map, isString, on, is } from 'tsfun';
import { ConfigurationDocument, CustomFormDefinition, Field, I18N, OVERRIDE_VISIBLE_FIELDS,
    CustomLanguageConfigurations, FieldResource, CustomSubfieldDefinition, Labels, Subfield,
    InPlace, Valuelists, Named } from 'idai-field-core';
import { InputType, ConfigurationUtil } from '../../configuration-util';
import { ConfigurationEditorModalComponent } from '../configuration-editor-modal.component';
import { Menus } from '../../../../services/menus';
import { Messages } from '../../../messages/messages';
import { Modals } from '../../../../services/modals';
import { MenuContext } from '../../../../services/menu-context';
import { M } from '../../../messages/m';
import { SubfieldEditorData, SubfieldEditorModalComponent } from './subfield-editor-modal.component';
import { Naming } from '../../add/naming';


@Component({
    templateUrl: './field-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class FieldEditorModalComponent extends ConfigurationEditorModalComponent {

    public field: Field|undefined;
    public groupName: string;
    public availableInputTypes: Array<InputType>;
    public permanentlyHiddenFields: string[];

    public clonedField: Field|undefined;
    public hideable: boolean;
    public hidden: boolean;
    public i18nCompatible: boolean;
    public newSubfieldName: string;
    public dragging: boolean;

    public newSubfieldInputPlaceholder: string = this.i18n({
        id: 'configuration.newSubfield', value: 'Neues Unterfeld'
    });

    private subfieldI18nStrings: Map<{ label?: I18N.String, description?: I18N.String }>;

    protected changeMessage = this.i18n({
        id: 'configuration.fieldChanged', value: 'Das Feld wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                modals: Modals,
                menuService: Menus,
                messages: Messages,
                private labels: Labels,
                private i18n: I18n) {

        super(activeModal, modals, menuService, messages);
    }


    public getCustomFieldDefinition = () => this.getCustomFormDefinition().fields[this.field.name];

    public getClonedFieldDefinition = () => this.getClonedFormDefinition().fields[this.field.name];

    public getClonedSubfieldDefinitions = () => this.getClonedFieldDefinition().subfields;

    public isValuelistSectionVisible = () => Field.InputType.VALUELIST_INPUT_TYPES.includes(
        this.getClonedFieldDefinition()?.inputType ?? this.field.inputType
    ) && !this.field.valuelistFromProjectField;

    public isSubfieldsSectionVisible = () => this.getInputType() === Field.InputType.COMPLEX;

    public isCustomField = () => this.field.source === 'custom';


    public initialize() {

        super.initialize();

        if (this.new) {
            this.getClonedFormDefinition().fields[this.field.name] = {
                inputType: 'input',
                constraintIndexed: false
            };
            this.clonedConfigurationDocument = ConfigurationDocument.addField(
                this.clonedConfigurationDocument, this.category, this.permanentlyHiddenFields,
                this.groupName, this.field.name
            );
        } else if (!this.getClonedFieldDefinition()) {
            this.getClonedFormDefinition().fields[this.field.name] = {};
        }

        if (!this.getClonedFieldDefinition().references) this.getClonedFieldDefinition().references = [];
        if (!this.getClonedFieldDefinition().subfields) this.getClonedFieldDefinition().subfields = [];

        this.clonedField = clone(this.field);

        this.hideable = this.isHideable();
        this.hidden = this.isHidden();

        this.subfieldI18nStrings = this.field.subfields?.reduce((result, subfield) => {
            result[subfield.name] = { label: subfield.label, description: subfield.description };
            return result;
        }, {}) ?? {};
    }


    public async confirm() {

        if (!this.field.valuelist && this.isValuelistSectionVisible()
                && !this.getClonedFormDefinition().valuelists?.[this.field.name]) {
            return this.messages.add([M.CONFIGURATION_ERROR_NO_VALUELIST]);
        }

        if (this.getClonedFieldDefinition().subfields?.length < 2 && this.isSubfieldsSectionVisible()) {
            return this.messages.add([M.CONFIGURATION_ERROR_NO_SUBFIELDS]);
        }

        try {
            ConfigurationUtil.cleanUpAndValidateReferences(this.getClonedFieldDefinition());
        } catch (errWithParams) {
            return this.messages.add(errWithParams);
        }

        if (!this.isValuelistSectionVisible() && this.getInputType() !== Field.InputType.COMPLEX
                && this.getClonedFormDefinition().valuelists) {
            delete this.getClonedFormDefinition().valuelists[this.field.name];
        }

        if (isEmpty(this.getClonedFieldDefinition())) {
            delete this.getClonedFormDefinition().fields[this.field.name];
        }

        if (!this.isSubfieldsSectionVisible()) {
            delete this.getClonedFieldDefinition().subfields;
            Object.keys(this.subfieldI18nStrings).forEach(subfieldName => {
                this.subfieldI18nStrings[subfieldName] = {};
            });
        }

        await super.confirm(this.isValuelistChanged());
    }


    public getInputType(): Field.InputType {

        return this.getClonedFieldDefinition()?.inputType as Field.InputType
            ?? this.field.inputType as Field.InputType;
    }


    public setInputType(newInputType: string) {

        if (!this.availableInputTypes.find(inputType => inputType.name === newInputType).searchable) {
            delete this.getClonedFieldDefinition().constraintIndexed;
        }
        if (newInputType === this.field.inputType && !this.getCustomFieldDefinition()?.inputType) {
            delete this.getClonedFieldDefinition().inputType;
            if (this.getCustomFieldDefinition()?.constraintIndexed) {
                this.getClonedFieldDefinition().constraintIndexed = this.field.constraintIndexed;
            }
        } else {
            this.getClonedFieldDefinition().inputType = newInputType;
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
            && (this.field.name !== FieldResource.SHORTDESCRIPTION)
            && this.availableInputTypes.find(inputType => inputType.name === this.getInputType()).searchable;
    }


    public getConstraintIndexedTooltip(): string {

       if (this.category.name === 'Project') {
            return this.i18n({
                id: 'configuration.fieldSpecificSearch.notAllowedForProjectFields',
                value: 'Eine feldspezifische Suche ist für Felder der Projekt-Kategorie nicht möglich.'
            });
        } else if (!this.availableInputTypes.find(inputType => inputType.name === this.getInputType()).searchable) {
            return this.i18n({
                id: 'configuration.fieldSpecificSearch.notAllowedForInputType',
                value: 'Eine feldspezifische Suche ist für Felder dieses Eingabetyps nicht möglich.'
            });
        } else if (this.field.name === FieldResource.SHORTDESCRIPTION) {
            return this.i18n({
                id: 'configuration.fieldSpecificSearch.changingNotAllowed',
                value: 'Die Einstellung kann für dieses Feld nicht geändert werden.'
            });
        } else {
            return '';
        }
    }


    public getInputTypeLabel(subfield: CustomSubfieldDefinition): string {

        return this.availableInputTypes.find(on(Named.NAME, is(subfield.inputType))).label;
    }


    public isI18nCompatible(): boolean {

        return Field.InputType.I18N_COMPATIBLE_INPUT_TYPES.includes(this.getInputType())
            && !['staff', 'campaigns'].includes(this.field.name);
    }


    public getSubfieldLabel(subfieldDefinition: CustomSubfieldDefinition) {
        
        return this.labels.get(this.getClonedSubfield(subfieldDefinition));
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
        componentInstance.projectLanguages = this.getClonedProjectLanguages();
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
            nop
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
        componentInstance.projectLanguages = this.getClonedProjectLanguages();
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.clonedConfigurationDocument = this.clonedConfigurationDocument;
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            editedSubfieldData => this.setEditedSubfieldData(editedSubfieldData, subfieldDefinition, clonedSubfield),
            nop
        );
    }


    public deleteSubfield(subfieldToDelete: CustomSubfieldDefinition) {

        this.getClonedFieldDefinition().subfields = this.getClonedFieldDefinition().subfields.filter(
            subfield => subfield.name !== subfieldToDelete.name
        );
        this.clonedField.subfields = this.clonedField.subfields.filter(
            subfield => subfield.name !== subfieldToDelete.name
        );
    }


    public onDropSubfield(event: CdkDragDrop<any>) {

        InPlace.moveInArray(this.getClonedFieldDefinition().subfields, event.previousIndex, event.currentIndex);
    }


    public isChanged(): boolean {

        return this.new
            || this.getCustomFieldDefinition()?.inputType !== this.getClonedFieldDefinition()?.inputType
            || !equal(this.getCustomFormDefinition().hidden)(this.getClonedFormDefinition().hidden)
            || this.isValuelistChanged()
            || this.isConstraintIndexedChanged()
            || this.isSubfieldsChanged()
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

    
    private addSubfield(newSubfieldDefinition: CustomSubfieldDefinition, newSubfield: Subfield) {

        if (!this.clonedField.subfields) this.clonedField.subfields = [];
        this.clonedField.subfields.push(newSubfield);
        this.getClonedFieldDefinition().subfields.push(newSubfieldDefinition);
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

        if (editedSubfieldData.condition?.subfieldName && editedSubfieldData.condition?.value !== undefined) {
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

        const clonedForm: CustomFormDefinition = this.getClonedFormDefinition();

        if (!clonedForm.valuelists) clonedForm.valuelists = {};

        const valuelists: Valuelists = clonedForm.valuelists;
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


    protected getLabel(): I18N.String {

        return this.field.label;
    }


    protected getDescription(): I18N.String {

        return this.field.description;
    }


    protected updateCustomLanguageConfigurations() {

        CustomLanguageConfigurations.update(
            this.getClonedLanguageConfigurations(), this.clonedLabel, this.clonedDescription,
            this.category, this.field
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


    private isHideable(): boolean {

        return !OVERRIDE_VISIBLE_FIELDS.includes(this.field.name)
            && this.field.source !== 'custom';
    }


    private isHidden(): boolean {

        return ConfigurationDocument.isHidden(this.getClonedFormDefinition())(this.field);
    }


    private getClonedSubfield(subfieldDefinition: CustomSubfieldDefinition): Subfield {

        return this.clonedField.subfields.find(clonedSubfield => {
            return clonedSubfield.name === subfieldDefinition.name;
        });
    }
}

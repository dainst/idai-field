import { Component } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone, equal, isEmpty, nop, Map } from 'tsfun';
import { ConfigurationDocument, CustomFormDefinition, Field, I18N, OVERRIDE_VISIBLE_FIELDS,
    CustomLanguageConfigurations, Valuelist, FieldResource, CustomSubfieldDefinition, Labels, Subfield,
    InPlace } from 'idai-field-core';
import { InputType, ConfigurationUtil } from '../../configuration-util';
import { ConfigurationEditorModalComponent } from '../configuration-editor-modal.component';
import { Menus } from '../../../../services/menus';
import { Messages } from '../../../messages/messages';
import { Modals } from '../../../../services/modals';
import { MenuContext } from '../../../../services/menu-context';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { ValuelistEditorModalComponent } from '../valuelist/valuelist-editor-modal.component';
import { ApplyChangesResult } from '../../configuration.component';
import { AddValuelistModalComponent } from '../../add/valuelist/add-valuelist-modal.component';
import { M } from '../../../messages/m';
import { AngularUtility } from '../../../../angular/angular-utility';
import { SubfieldEditorModalComponent } from './subfield-editor-modal.component';


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
    public dragging: boolean;

    private subfieldI18nStrings: Map<{ label?: I18N.String, description?: I18N.String }>;

    protected changeMessage = this.i18n({
        id: 'configuration.fieldChanged', value: 'Das Feld wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                modals: Modals,
                menuService: Menus,
                messages: Messages,
                private configurationIndex: ConfigurationIndex,
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

    public isEditValuelistButtonVisible = () => this.clonedField.valuelist
        && this.clonedConfigurationDocument.resource.valuelists?.[this.clonedField.valuelist.id];

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

        this.subfieldI18nStrings = {};
    }


    public async confirm() {

        if (!this.field.valuelist && this.isValuelistSectionVisible()
                && !this.getClonedFormDefinition().valuelists?.[this.field.name]) {
            return this.messages.add([M.CONFIGURATION_ERROR_NO_VALUELIST]);
        }

        try {
            ConfigurationUtil.cleanUpAndValidateReferences(this.getClonedFieldDefinition());
        } catch (errWithParams) {
            return this.messages.add(errWithParams);
        }

        if (!this.isValuelistSectionVisible() && this.getClonedFormDefinition().valuelists) {
            delete this.getClonedFormDefinition().valuelists[this.field.name];
        }

        if (isEmpty(this.getClonedFieldDefinition())) {
            delete this.getClonedFormDefinition().fields[this.field.name];
        }

        if (!this.isSubfieldsSectionVisible()) {
            delete this.getClonedFieldDefinition().subfields;
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

    public async selectValuelist() {

        const [result, componentInstance] = this.modals.make<AddValuelistModalComponent>(
            AddValuelistModalComponent,
            MenuContext.CONFIGURATION_MANAGEMENT,
            'lg'
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.clonedConfigurationDocument = this.clonedConfigurationDocument;
        componentInstance.category = this.category;
        componentInstance.clonedField = this.clonedField;
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            (applyChangesResult?: ApplyChangesResult) => {
                if (!applyChangesResult) return;
                this.configurationDocument = applyChangesResult.configurationDocument;
                this.configurationIndex = applyChangesResult.configurationIndex;
            },
            nop
        );

        AngularUtility.blurActiveElement();
    }


    public async editValuelist() {

        const [result, componentInstance] = this.modals.make<ValuelistEditorModalComponent>(
            ValuelistEditorModalComponent,
            MenuContext.CONFIGURATION_VALUELIST_EDIT,
            'lg'
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.valuelist = this.clonedField.valuelist;
        if (this.clonedField.valuelist.extendedValuelist) {
            componentInstance.extendedValuelist
                = this.configurationIndex.getValuelist(this.clonedField.valuelist.extendedValuelist);
        }
        componentInstance.openedFromFieldEditor = true;
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            (applyChangesResult: ApplyChangesResult) => {
                this.configurationDocument = applyChangesResult.configurationDocument;
                this.configurationIndex = applyChangesResult.configurationIndex;
                this.updateEditedValuelist(this.configurationDocument);
            },
            nop
        );

        AngularUtility.blurActiveElement();
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

    public isI18nCompatible(): boolean {

        return Field.InputType.I18N_COMPATIBLE_INPUT_TYPES.includes(this.getInputType())
            && !['staff', 'campaigns'].includes(this.field.name);
    }


    public getSubfieldLabel(subfieldDefinition: CustomSubfieldDefinition) {
        
        return this.labels.get(this.getClonedSubfield(subfieldDefinition));
    }

    
    public async editSubfield(subfield: CustomSubfieldDefinition) {

        const [result, componentInstance] = this.modals.make<SubfieldEditorModalComponent>(
            SubfieldEditorModalComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        componentInstance.subfield = this.getClonedSubfield(subfield);
        componentInstance.parentField = this.clonedField;
        componentInstance.references = subfield.references;
        componentInstance.availableInputTypes = this.availableInputTypes;
        componentInstance.projectLanguages = this.getClonedProjectLanguages();
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            editedSubfieldData => {
                subfield.inputType = editedSubfieldData.inputType;
                subfield.references = editedSubfieldData.references;

                if (!this.subfieldI18nStrings[subfield.name]) this.subfieldI18nStrings[subfield.name] = {};
                this.subfieldI18nStrings[subfield.name] = {
                    label: editedSubfieldData.label,
                    description: editedSubfieldData.description
                };
            },
            nop
        );
    }


    public deleteSubfield(subfieldToDelete: CustomSubfieldDefinition) {

        this.getClonedFieldDefinition().subfields = this.getClonedFieldDefinition().subfields.filter(
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


    private updateEditedValuelist(newConfigurationDocument: ConfigurationDocument) {

        this.clonedConfigurationDocument._rev = newConfigurationDocument._rev;
        this.clonedConfigurationDocument.created = newConfigurationDocument.created;
        this.clonedConfigurationDocument.modified = newConfigurationDocument.modified;
        this.clonedConfigurationDocument.resource.valuelists = newConfigurationDocument.resource.valuelists;

        const valuelistId: string = this.clonedField.valuelist.id;
        this.clonedField.valuelist = clone(this.clonedConfigurationDocument.resource.valuelists[valuelistId]);
        this.clonedField.valuelist.id = valuelistId;

        if (this.clonedField.valuelist.extendedValuelist) {
            this.clonedField.valuelist = Valuelist.applyExtension(
                this.clonedField.valuelist,
                this.configurationIndex.getValuelist(this.clonedField.valuelist.extendedValuelist)
            );
        }
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
                this.subfieldI18nStrings[subfieldName].label,
                this.subfieldI18nStrings[subfieldName].description,
                this.category,
                this.field,
                this.field.subfields.find(subfield => subfield.name === subfieldName)
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

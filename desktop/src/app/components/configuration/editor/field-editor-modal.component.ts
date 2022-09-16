import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone, equal, isEmpty, nop, not, isUndefined } from 'tsfun';
import { ConfigurationDocument, CustomFormDefinition, Field, I18N, OVERRIDE_VISIBLE_FIELDS,
    CustomLanguageConfigurations, Valuelist } from 'idai-field-core';
import { InputType, ConfigurationUtil } from '../../../components/configuration/configuration-util';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';
import { Menus } from '../../../services/menus';
import { Messages } from '../../messages/messages';
import { Modals } from '../../../services/modals';
import { MenuContext } from '../../../services/menu-context';
import { ConfigurationIndex } from '../../../services/configuration/index/configuration-index';
import { ValuelistEditorModalComponent } from './valuelist-editor-modal.component';
import { ApplyChangesResult } from '../configuration.component';
import { AddValuelistModalComponent } from '../add/valuelist/add-valuelist-modal.component';
import { M } from '../../messages/m';
import { AngularUtility } from '../../../angular/angular-utility';


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

    protected changeMessage = this.i18n({
        id: 'configuration.fieldChanged', value: 'Das Feld wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                modals: Modals,
                menuService: Menus,
                messages: Messages,
                private configurationIndex: ConfigurationIndex,
                private i18n: I18n) {

        super(activeModal, modals, menuService, messages);
    }


    public getCustomFieldDefinition = () => this.getCustomFormDefinition().fields[this.field.name];

    public getClonedFieldDefinition = () => this.getClonedFormDefinition().fields[this.field.name];

    public isValuelistSectionVisible = () => Field.InputType.VALUELIST_INPUT_TYPES.includes(
        this.getClonedFieldDefinition()?.inputType ?? this.field.inputType
    ) && !this.field.valuelistFromProjectField;

    public isEditValuelistButtonVisible = () => this.clonedField.valuelist
        && this.clonedConfigurationDocument.resource.valuelists?.[this.clonedField.valuelist.id];

    public isCustomField = () => this.field.source === 'custom';

    public isI18nCompatible = () => Field.InputType.I18N_COMPATIBLE_INPUT_TYPES.includes(this.getInputType());

    public isI18nInputType = () => Field.InputType.I18N_INPUT_TYPES.includes(this.getInputType());

    public isI18nOptionEnabled = () => this.getInputType() !== Field.InputType.TEXT;


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

        this.clonedField = clone(this.field);
        this.hideable = this.isHideable();
        this.hidden = this.isHidden();
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

        await super.confirm(this.isValuelistChanged());
    }


    public getAvailableInputTypes(): Array<InputType> {

        if (this.field.fixedInputType) return [];

        const inputTypes: Array<InputType> = this.availableInputTypes.filter(inputType => {
            return inputType.customFields && !Field.InputType.SIMPLE_INPUT_TYPES.includes(inputType.name);
        });

        return this.isCustomField()
            ? inputTypes
            : Field.InputType.getInterchangeableInputTypes(this.getInputType())
                .map(alternativeType => inputTypes.find(inputType => inputType.name === alternativeType))
                .filter(not(isUndefined));
    }


    public getInputType(): Field.InputType {

        return this.getClonedFieldDefinition()?.inputType as Field.InputType
            ?? this.field.inputType as Field.InputType;
    }


    public setInputType(newInputType: string) {

        if (!this.availableInputTypes.find(inputType => inputType.name === newInputType).searchable) {
            delete this.getClonedFieldDefinition().constraintIndexed;
        }
        this.getClonedFieldDefinition().inputType = newInputType;
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
            && (this.field.source === 'custom' || this.field.defaultConstraintIndexed)
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
        } else if (this.field.source !== 'custom' && !this.field.defaultConstraintIndexed) {
            return this.i18n({
                id: 'configuration.fieldSpecificSearch.changingNotAllowed',
                value: 'Die Einstellung kann für dieses Feld nicht geändert werden.'
            });
        } else {
            return '';
        }
    }

    public getI18nOptionTooltip(): string {

        if (this.getInputType() === Field.InputType.TEXT) {
            return this.i18n({
                id: 'configuration.i18nOption.changingNotAllowed',
                value: 'Die Eingabe in mehreren Sprachen ist für Felder dieses Eingabetyps immer aktiviert.'
            });
        } else {
            return '';
        }
    }


    public isSelectedInputType(inputType: Field.InputType): boolean {

        const selectedInputType: Field.InputType = this.getInputType();

        switch (selectedInputType) {
            case Field.InputType.SIMPLE_INPUT:
                return inputType === Field.InputType.INPUT;
            case Field.InputType.SIMPLE_MULTIINPUT:
                return inputType === Field.InputType.MULTIINPUT;
            default:
                return inputType === selectedInputType;
        }
    }


    public toggleI18nInput() {

        switch (this.getInputType()) {
            case Field.InputType.INPUT:
                this.setInputType(Field.InputType.SIMPLE_INPUT);
                break;
            case Field.InputType.SIMPLE_INPUT:
                this.setInputType(Field.InputType.INPUT);
                break;
            case Field.InputType.MULTIINPUT:
                this.setInputType(Field.InputType.SIMPLE_MULTIINPUT);
                break;
            case Field.InputType.SIMPLE_MULTIINPUT:
                this.setInputType(Field.InputType.MULTIINPUT);
                break;
        }
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
    }


    private isHideable(): boolean {

        return !OVERRIDE_VISIBLE_FIELDS.includes(this.field.name)
            && this.field.source !== 'custom';
    }


    private isHidden(): boolean {

        return ConfigurationDocument.isHidden(this.getClonedFormDefinition())(this.field);
    }
}

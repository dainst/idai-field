import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone, equal, isEmpty, nop } from 'tsfun';
import { ConfigurationDocument, CustomFormDefinition, Field, I18N, OVERRIDE_VISIBLE_FIELDS,
    CustomLanguageConfigurations, Valuelist } from 'idai-field-core';
import { InputType } from '../../../components/configuration/configuration-util';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';
import { Menus } from '../../../services/menus';
import { Messages } from '../../messages/messages';
import { Modals } from '../../../services/modals';
import { MenuContext } from '../../../services/menu-context';
import { ConfigurationIndex } from '../../../services/configuration/index/configuration-index';
import { ValuelistEditorModalComponent } from './valuelist-editor-modal.component';
import { SaveResult } from '../configuration.component';
import { AddValuelistModalComponent } from '../add/valuelist/add-valuelist-modal.component';
import { M } from '../../messages/m';


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

    protected changeMessage = this.i18n({
        id: 'configuration.fieldChanged', value: 'Das Feld wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                modalService: NgbModal,
                menuService: Menus,
                messages: Messages,
                private configurationIndex: ConfigurationIndex,
                private modals: Modals,
                private i18n: I18n) {

        super(activeModal, modalService, menuService, messages);
    }

    public getCustomFieldDefinition = () => this.getCustomFormDefinition().fields[this.field.name];

    public getClonedFieldDefinition = () => this.getClonedFormDefinition().fields[this.field.name];

    public getAvailableInputTypes = () => this.availableInputTypes.filter(inputType => inputType.customFields);

    public isValuelistSectionVisible = () => Field.InputType.VALUELIST_INPUT_TYPES.includes(
        this.getClonedFieldDefinition()?.inputType ?? this.field.inputType
    );

    public isEditValuelistButtonVisible = () => this.clonedField.valuelist
        && this.clonedConfigurationDocument.resource.valuelists?.[this.clonedField.valuelist.id];


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

        this.clonedField = clone(this.field);
        this.hideable = this.isHideable();
        this.hidden = this.isHidden();
    }


    public async save() {

        const valuelistRequired: boolean = Field.InputType.VALUELIST_INPUT_TYPES
            .includes(this.getClonedFieldDefinition().inputType ?? this.field.inputType);

        if (valuelistRequired && (!this.getClonedFormDefinition().valuelists
                || !this.getClonedFormDefinition().valuelists[this.field.name])) {
            return this.messages.add([M.CONFIGURATION_ERROR_NO_VALUELIST]);
        }

        if (!valuelistRequired && this.getClonedFormDefinition().valuelists) {
            delete this.getClonedFormDefinition().valuelists[this.field.name];
        }

        if (isEmpty(this.getClonedFieldDefinition())) {
            delete this.getClonedFormDefinition().fields[this.field.name];
        }

        await super.save(this.isConstraintIndexedChanged(), this.isValuelistChanged());
    }


    public getInputType() {

        return this.getClonedFieldDefinition()?.inputType
            ?? this.field.inputType;
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
            MenuContext.CONFIGURATION_MODAL,
            'lg'
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.clonedConfigurationDocument = this.clonedConfigurationDocument;
        componentInstance.category = this.category;
        componentInstance.clonedField = this.clonedField;
        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            (saveResult?: SaveResult) => {
                if (!saveResult) return;
                this.configurationDocument = saveResult.configurationDocument;
                this.configurationIndex = saveResult.configurationIndex;
            },
            nop
        );
    }


    public async editValuelist() {

        const [result, componentInstance] = this.modals.make<ValuelistEditorModalComponent>(
            ValuelistEditorModalComponent,
            MenuContext.CONFIGURATION_MODAL,
            'lg'
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.valuelist = this.clonedField.valuelist;
        if (this.clonedField.valuelist.extendedValuelist) {
            componentInstance.extendedValuelist
                = this.configurationIndex.getValuelist(this.clonedField.valuelist.extendedValuelist);
        }
        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            (saveResult: SaveResult) => {
                this.configurationDocument = saveResult.configurationDocument;
                this.configurationIndex = saveResult.configurationIndex;
                this.updateEditedValuelist(this.configurationDocument);
            },
            nop
        );
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


    public isChanged(): boolean {

        return this.new
            || this.getCustomFieldDefinition()?.inputType !== this.getClonedFieldDefinition()?.inputType
            || !equal(this.getCustomFormDefinition().hidden)(this.getClonedFormDefinition().hidden)
            || this.isValuelistChanged()
            || this.isConstraintIndexedChanged()
            || !equal(this.label)(this.clonedLabel)
            || !equal(this.description)(this.clonedDescription);
    }


    private isValuelistChanged(): boolean {

        return !equal(this.getCustomFormDefinition().valuelists ?? {})
            (this.getClonedFormDefinition().valuelists ?? {});
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

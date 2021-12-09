import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { clone, equal, isEmpty, nop } from 'tsfun';
import { ConfigurationDocument, CustomFormDefinition, Field, GroupDefinition, I18N, OVERRIDE_VISIBLE_FIELDS,
    CustomLanguageConfigurations } from 'idai-field-core';
import { ConfigurationUtil, InputType } from '../../../components/configuration/configuration-util';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';
import { Menus } from '../../../services/menus';
import { Messages } from '../../messages/messages';
import { Modals } from '../../../services/modals';
import { AddValuelistModalComponent } from '../add/valuelist/add-valuelist-modal.component';
import { MenuContext } from '../../../services/menu-context';
import { ConfigurationIndex } from '../index/configuration-index';
import { ValuelistEditorModalComponent } from './valuelist-editor-modal.component';


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
    public configurationIndex: ConfigurationIndex;

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
            const groups: Array<GroupDefinition> = ConfigurationUtil.createGroupsConfiguration(
                this.category, this.permanentlyHiddenFields
            );
            groups.find(group => group.name === this.groupName).fields.push(this.field.name);
            this.getClonedFormDefinition().groups = groups;
        } else if (!this.getClonedFieldDefinition()) {
            this.getClonedFormDefinition().fields[this.field.name] = {};
        }

        this.clonedField = clone(this.field);
        this.hideable = this.isHideable();
        this.hidden = this.isHidden();
    }


    public async save() {

        if (!Field.InputType.VALUELIST_INPUT_TYPES
                .includes(this.getClonedFieldDefinition().inputType ?? this.field.inputType)
                && this.getClonedFormDefinition().valuelists) {
            delete this.getClonedFormDefinition().valuelists[this.field.name];
        }

        if (isEmpty(this.getClonedFieldDefinition())) {
            delete this.getClonedFormDefinition().fields[this.field.name];
        }

        await super.save(this.isConstraintIndexedChanged());
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

    
    public selectValuelist() {

        const [result, componentInstance] = this.modals.make<AddValuelistModalComponent>(
            AddValuelistModalComponent,
            MenuContext.CONFIGURATION_MODAL,
            'lg'
        );

        componentInstance.configurationIndex = this.configurationIndex;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.clonedConfigurationDocument = this.clonedConfigurationDocument;
        componentInstance.category = this.category;
        componentInstance.clonedField = this.clonedField;
        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.initialize();

        this.modals.awaitResult(result, nop, nop);
    }


    public editValuelist() {

        const [result, componentInstance] = this.modals.make<ValuelistEditorModalComponent>(
            ValuelistEditorModalComponent,
            MenuContext.CONFIGURATION_MODAL,
            'lg'
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = this.category;
        componentInstance.valuelist = this.clonedField.valuelist;
        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.initialize();

        this.modals.awaitResult(
            result,
            newConfigurationDocument => this.updateEditedValuelist(newConfigurationDocument),
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
            || !equal(this.getCustomFormDefinition().valuelists)(this.getClonedFormDefinition().valuelists)
            || this.isConstraintIndexedChanged()
            || !equal(this.label)(this.clonedLabel)
            || !equal(this.description)(this.clonedDescription);
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

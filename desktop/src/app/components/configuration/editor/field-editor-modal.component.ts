import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { equal, isEmpty } from 'tsfun';
import { CustomCategoryDefinition, FieldDefinition, GroupDefinition, I18N, ProjectCategories } from 'idai-field-core';
import { ConfigurationUtil, OVERRIDE_VISIBLE_FIELDS } from '../../../core/configuration/configuration-util';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';
import { Menus } from '../../services/menus';
import { Messages } from '../../messages/messages';
import { InputType } from '../configuration.component';
import { LanguageConfigurationUtil } from '../../../core/configuration/language-configuration-util';


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

    public field: FieldDefinition|undefined;
    public groupName: string;
    public availableInputTypes: Array<InputType>;
    public permanentlyHiddenFields: string[];

    public hideable: boolean;
    public hidden: boolean;

    protected changeMessage = this.i18n({
        id: 'docedit.saveModal.fieldChanged', value: 'Das Feld wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                modalService: NgbModal,
                menuService: Menus,
                messages: Messages,
                private i18n: I18n) {

        super(activeModal, modalService, menuService, messages);
    }

    public getCustomFieldDefinition = () => this.getCustomCategoryDefinition().fields[this.field.name];

    public getClonedFieldDefinition = () => this.getClonedCategoryDefinition().fields[this.field.name];


    public initialize() {

        super.initialize();

        if (this.new) {
            this.getClonedCategoryDefinition().fields[this.field.name] = {
                inputType: 'input',
                constraintIndexed: false
            };
            const groups: Array<GroupDefinition> = ConfigurationUtil.createGroupsConfiguration(
                this.category, this.permanentlyHiddenFields
            );
            groups.find(group => group.name === this.groupName).fields.push(this.field.name);
            this.getClonedCategoryDefinition().groups = groups;
        } else if (!this.getClonedFieldDefinition()) {
            this.getClonedCategoryDefinition().fields[this.field.name] = {};
        }

        this.hideable = this.isHideable();
        this.hidden = this.isHidden();
    }


    public async save() {

        if (isEmpty(this.getClonedFieldDefinition())) {
            delete this.getClonedCategoryDefinition().fields[this.field.name];
        }

        super.save(this.isConstraintIndexedChanged());
    }


    public getInputType() {

        return this.getClonedFieldDefinition().inputType
            ?? this.field.inputType;
    }


    public setInputType(newInputType: string) {

        this.getClonedFieldDefinition().inputType = newInputType;
    }


    public toggleHidden() {

        const customCategoryDefinition: CustomCategoryDefinition = this.getClonedCategoryDefinition();

        if (this.hidden) {
            customCategoryDefinition.hidden
                = customCategoryDefinition.hidden.filter(name => name !== this.field.name);
        } else {
            if (!customCategoryDefinition.hidden) customCategoryDefinition.hidden = [];
            customCategoryDefinition.hidden.push(this.field.name);
        }

        this.hidden = this.isHidden();
    }


    public toggleConstraintIndexed() {

        if (!this.field.defaultConstraintIndexed) {
            this.getClonedFieldDefinition().constraintIndexed = !this.getClonedFieldDefinition().constraintIndexed;
        } else if (this.getClonedFieldDefinition().constraintIndexed === undefined) {
            this.getClonedFieldDefinition().constraintIndexed = !this.field.defaultConstraintIndexed;
        } else {
            delete this.getClonedFieldDefinition().constraintIndexed;
        }
    }


    public isConstraintIndexed() {

        return this.getClonedFieldDefinition().constraintIndexed
            || (this.getClonedFieldDefinition().constraintIndexed !== false && this.field.constraintIndexed);
    }


    public isConstraintIndexOptionShown(): boolean {
        
        return this.category.name !== 'Project'
            && this.availableInputTypes.find(inputType => inputType.name === this.getInputType()).searchable;
    };


    public isChanged(): boolean {

        return this.new
            || this.getCustomFieldDefinition()?.inputType !== this.getClonedFieldDefinition().inputType
            || !equal(this.getCustomCategoryDefinition().hidden)(this.getClonedCategoryDefinition().hidden)
            || this.isConstraintIndexedChanged()
            || !equal(this.label)(this.clonedLabel)
            || !equal(this.description)(this.clonedDescription);
    }


    private isConstraintIndexedChanged(): boolean {

        return this.getCustomFieldDefinition()?.constraintIndexed !== this.getClonedFieldDefinition().constraintIndexed
            || (this.getCustomFieldDefinition()?.constraintIndexed === undefined
                && this.getClonedFieldDefinition().constraintIndexed === false)
            || (this.getCustomFieldDefinition()?.constraintIndexed === false
                && this.getClonedFieldDefinition().constraintIndexed === undefined);
    }


    protected getLabel(): I18N.String {

        return this.field.label;
    }


    protected getDescription(): I18N.String {

        return this.field.description;
    }


    protected updateCustomLanguageConfigurations() {

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            this.getClonedLanguageConfigurations(), this.clonedLabel, this.clonedDescription,
            this.category, this.field
        );
    }


    private isHideable(): boolean {

        return !OVERRIDE_VISIBLE_FIELDS.includes(this.field.name)
            && this.field.source !== 'custom';
    }


    private isHidden(): boolean {

        return ConfigurationUtil.isHidden(this.getClonedCategoryDefinition())(this.field);
    }
}

import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { equal, isEmpty } from 'tsfun';
import { CustomCategoryDefinition, FieldDefinition, GroupDefinition, I18nString } from 'idai-field-core';
import { ConfigurationUtil, OVERRIDE_VISIBLE_FIELDS } from '../../../core/configuration/configuration-util';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';
import { MenuService } from '../../menu-service';
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
                menuService: MenuService,
                messages: Messages,
                private i18n: I18n) {

        super(activeModal, modalService, menuService, messages);
    }


    public initialize() {

        super.initialize();

        if (this.new) {
            this.getClonedCategoryDefinition().fields[this.field.name] = {
                inputType: 'input'
            };
            const groups: Array<GroupDefinition> = ConfigurationUtil.createGroupsConfiguration(
                this.category, this.permanentlyHiddenFields
            );
            groups.find(group => group.name === this.groupName).fields.push(this.field.name);
            this.getClonedCategoryDefinition().groups = groups;
        } else if (!this.getClonedCategoryDefinition().fields[this.field.name]) {
            this.getClonedCategoryDefinition().fields[this.field.name] = {};
        }

        this.hideable = this.isHideable();
        this.hidden = this.isHidden();
    }


    public async save() {

        if (isEmpty(this.getClonedCategoryDefinition().fields[this.field.name])) {
            delete this.getClonedCategoryDefinition().fields[this.field.name];
        }

        super.save();
    }


    public getInputType() {

        return this.getClonedCategoryDefinition().fields[this.field.name].inputType
            ?? this.field.inputType;
    }


    public setInputType(newInputType: string) {

        this.getClonedCategoryDefinition().fields[this.field.name].inputType = newInputType;
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


    public isChanged(): boolean {

        return this.new
            || this.getCustomCategoryDefinition().fields[this.field.name]?.inputType !==
                this.getClonedCategoryDefinition().fields[this.field.name]?.inputType
            || !equal(this.getCustomCategoryDefinition().hidden)(this.getClonedCategoryDefinition().hidden)
            || !equal(this.label)(this.clonedLabel)
            || !equal(this.description)(this.clonedDescription);
    }


    protected getLabel(): I18nString {

        return this.field.label;
    }


    protected getDescription(): I18nString {

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

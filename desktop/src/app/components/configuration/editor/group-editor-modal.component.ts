import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { equal, } from 'tsfun';
import { Group, GroupDefinition, I18N } from 'idai-field-core';
import { ConfigurationEditorModalComponent } from './configuration-editor-modal.component';
import { Menus } from '../../../services/menus';
import { Messages } from '../../messages/messages';
import { CustomLanguageConfigurations } from '../../../components/configuration/custom-language-configurations';
import { ConfigurationUtil } from '../../../components/configuration/configuration-util';


@Component({
    templateUrl: './group-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class GroupEditorModalComponent extends ConfigurationEditorModalComponent {

    public group: Group;
    public permanentlyHiddenFields: string[];

    protected changeMessage = this.i18n({
        id: 'docedit.saveModal.groupChanged', value: 'Die Gruppe wurde geändert.'
    });


    constructor(activeModal: NgbActiveModal,
                modalService: NgbModal,
                menuService: Menus,
                messages: Messages,
                private i18n: I18n) {

        super(activeModal, modalService, menuService, messages);
    }


    public initialize() {

        super.initialize();

        if (this.new) {
            const groups: Array<GroupDefinition> = ConfigurationUtil.createGroupsConfiguration(
                this.category, this.permanentlyHiddenFields
            );
            groups.push({
                name: this.group.name,
                fields: []
            });
            this.getClonedFormDefinition().groups = groups;
        }
    }


    public isChanged(): boolean {

        return this.new || !equal(this.label)(this.clonedLabel);
    }


    protected getLabel(): I18N.String {

        return this.group.label;
    }


    protected getDescription(): I18N.String {

        return undefined;
    }


    protected updateCustomLanguageConfigurations() {

        CustomLanguageConfigurations.update(
            this.getClonedLanguageConfigurations(),
            this.clonedLabel, undefined, undefined, undefined, this.group
        );
    }
}

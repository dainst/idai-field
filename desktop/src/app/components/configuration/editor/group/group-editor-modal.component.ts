import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { equal, } from 'tsfun';
import { Group, GroupDefinition, I18N, CustomLanguageConfigurations, CategoryForm } from 'idai-field-core';
import { ConfigurationEditorModalComponent } from '../configuration-editor-modal.component';
import { Menus } from '../../../../services/menus';
import { Messages } from '../../../messages/messages';
import { Modals } from '../../../../services/modals';


@Component({
    templateUrl: './group-editor-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class GroupEditorModalComponent extends ConfigurationEditorModalComponent {

    public group: Group;
    public permanentlyHiddenFields: string[];

    protected changeMessage = $localize `:@@configuration.groupChanged:Die Gruppe wurde geändert.`;


    constructor(activeModal: NgbActiveModal,
                modals: Modals,
                menuService: Menus,
                messages: Messages) {

        super(activeModal, modals, menuService, messages);
    }


    public initialize() {

        super.initialize();

        if (this.new) {
            const groups: Array<GroupDefinition> = CategoryForm.getGroupsConfiguration(
                this.category, this.permanentlyHiddenFields
            );
            groups.push({
                name: this.group.name,
                fields: []
            });
            this.getClonedFormDefinition().groups = groups;
        }
    }



    public async confirm() {

        await super.confirm(true);
    }


    public isChanged(): boolean {

        return this.new || !equal(this.label)(I18N.removeEmpty(this.clonedLabel));
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
            this.clonedLabel, undefined, undefined, undefined, undefined, this.group
        );
    }
}

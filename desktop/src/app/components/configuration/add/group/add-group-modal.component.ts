import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { nop } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Labels, SortUtil, Document, GroupDefinition } from 'idai-field-core';
import { GroupEntry } from '../../../../services/configuration/index/group-index';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { Modals } from '../../../../services/modals';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';
import { GroupEditorModalComponent } from '../../editor/group/group-editor-modal.component';
import { Naming } from '../naming';
import { SettingsProvider } from '../../../../services/settings/settings-provider';


@Component({
    templateUrl: './add-group-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class AddGroupModalComponent {

    public configurationDocument: ConfigurationDocument;
    public category: CategoryForm;
    public permanentlyHiddenFields: string[];
    public applyChanges: (configurationDocument: ConfigurationDocument) => Promise<ConfigurationDocument>;

    public searchTerm: string = '';
    public selectedGroup: GroupEntry|undefined;
    public emptyGroup: GroupEntry|undefined;
    public groups: Array<GroupEntry> = [];


    constructor(public activeModal: NgbActiveModal,
                private configurationIndex: ConfigurationIndex,
                private modals: Modals,
                private menus: Menus,
                private labels: Labels,
                private settingsProvider: SettingsProvider) {}


    public initialize() {
    
        this.applyGroupNameSearch();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.CONFIGURATION_MANAGEMENT) {
            this.activeModal.dismiss('cancel');
        }
    }


    public select(group: GroupEntry) {

        if (group === this.emptyGroup) {
            this.createNewGroup();
        } else {
            this.selectedGroup = group;
        }
    }


    public async confirmSelection() {

        if (!this.selectedGroup) return;

        await this.addSelectedGroup();
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public applyGroupNameSearch() {

        this.groups = this.configurationIndex.findGroups(this.searchTerm)
            .filter(group => !this.category.groups.find(categoryGroup => group.name === categoryGroup.name))
            .sort((group1, group2) => SortUtil.alnumCompare(this.labels.get(group1), this.labels.get(group2)));

        this.selectedGroup = this.groups?.[0];
        this.emptyGroup = this.getEmptyGroup();
    }


    private async addSelectedGroup() {

        const clonedConfigurationDocument = Document.clone(this.configurationDocument);
        const groups: Array<GroupDefinition> = CategoryForm.getGroupsConfiguration(
            this.category, this.permanentlyHiddenFields
        );
        groups.push({ name: this.selectedGroup.name, fields: [] });
        ConfigurationDocument.getCustomCategoryDefinition(clonedConfigurationDocument, this.category).groups = groups;

        try {
            await this.applyChanges(clonedConfigurationDocument);
            this.activeModal.close(this.selectedGroup.name);
        } catch {
            // Stay in modal
        }
    }


    private async createNewGroup() {

        const [result, componentInstance] = this.modals.make<GroupEditorModalComponent>(
            GroupEditorModalComponent,
            MenuContext.CONFIGURATION_EDIT,
            'lg'
        );

        componentInstance.applyChanges = this.applyChanges;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = this.category;
        componentInstance.permanentlyHiddenFields = this.permanentlyHiddenFields;
        componentInstance.group = {
            name: this.emptyGroup.name,
            label: {},
            defaultLabel: {},
            fields: []
        };
        componentInstance.new = true;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            () => this.activeModal.close(this.emptyGroup.name),
            nop
        );
    }


    private getEmptyGroup(): GroupEntry|undefined {

        if (this.searchTerm.length === 0) return undefined;

        return {
            name: Naming.getFieldOrGroupName(this.searchTerm, this.settingsProvider.getSettings().selectedProject)
        } as GroupEntry;
    }
}

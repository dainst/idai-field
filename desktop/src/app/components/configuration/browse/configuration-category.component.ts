import { Component, Input, OnChanges, Output, SimpleChanges, EventEmitter } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { and, any, compose, includedIn, is, map, nop, not, on, or, Predicate, to } from 'tsfun';
import { CategoryForm, ConfigurationDocument, Field, Group, Named, Document, GroupDefinition, InPlace,
    Labels, ProjectConfiguration} from 'idai-field-core';
import { InputType } from '../configuration-util';
import { AddFieldModalComponent } from '../add/field/add-field-modal.component';
import { Messages } from '../../messages/messages';
import { AddGroupModalComponent } from '../add/group/add-group-modal.component';
import { ConfigurationContextMenu } from '../context-menu/configuration-context-menu';
import { MenuContext } from '../../../services/menu-context';
import { Modals } from '../../../services/modals';
import { ConfigurationState } from '../configuration-state';
import { SettingsProvider } from '../../../services/settings/settings-provider';


@Component({
    selector: 'configuration-category',
    templateUrl: './configuration-category.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ConfigurationCategoryComponent implements OnChanges {

    @Input() category: CategoryForm;
    @Input() configurationDocument: ConfigurationDocument;
    @Input() clonedProjectConfiguration: ProjectConfiguration;
    @Input() showHiddenFields: boolean = true;
    @Input() availableInputTypes: Array<InputType>;
    @Input() contextMenu: ConfigurationContextMenu;

    @Input() applyChanges: (configurationDocument: ConfigurationDocument) => Promise<void>;

    @Output() onEditCategory: EventEmitter<void> = new EventEmitter<void>();
    @Output() onEditGroup: EventEmitter<Group> = new EventEmitter<Group>();
    @Output() onEditField: EventEmitter<Field> = new EventEmitter<Field>();
    @Output() onDragging: EventEmitter<boolean> = new EventEmitter<boolean>();

    public selectedGroup: string;
    public label: string;
    public description: string;
    public openedFieldName: string;
    public draggingField: boolean = false;

    private permanentlyHiddenFields: string[];


    constructor(private modals: Modals,
                private messages: Messages,
                private labels: Labels,
                private configurationState: ConfigurationState,
                private settingsProvider: SettingsProvider) {}


    ngOnChanges(changes: SimpleChanges) {

        if (changes['category']) {
            if (!changes['category'].previousValue) {
                this.selectGroup(this.configurationState.getSelectedGroupName() ?? this.category.groups[0].name);
            } else if (changes['category'].currentValue.name !== changes['category'].previousValue.name
                    || !this.category.groups.map(to(Named.NAME)).includes(this.selectedGroup)) {
                this.selectGroup(this.selectedGroup = this.category.groups[0].name);
            }
            this.permanentlyHiddenFields = ConfigurationDocument.getPermanentlyHiddenFields(this.category);
            this.openedFieldName = undefined;
        }

        this.updateLabelAndDescription();
    }

    public getGroupLabel = (group: Group) => this.labels.get(group);

    public getGroupListIds = () => this.category.groups.map(group => this.getGroupId(group));

    public getCustomLanguageConfigurations = () => this.configurationDocument.resource.languages;

    public isHidden = (field: Field) =>
        ConfigurationDocument.isHidden(this.getCustomCategoryDefinition(), this.getParentCustomCategoryDefinition())(field);

    public getCustomCategoryDefinition = () => ConfigurationDocument.getCustomCategoryDefinition(
        this.configurationDocument, this.category
    );

    public getParentCustomCategoryDefinition = () => ConfigurationDocument.getParentCustomCategoryDefinition(
        this.configurationDocument, this.category
    );

    public getCategoryId = () => 'category-' + this.category.name.replace(':', '-');

    public getGroupId = (group: Group) => 'group-' + group.name.replace(':', '-');

    public highlightForCustomFields = (group: Group) => this.hasCustomFields(group)
        && this.settingsProvider.getSettings().highlightCustomElements;

    public hasCustomFields: Predicate<Group> = compose(
        to<Array<Field>>(Group.FIELDS),
        map(_ => _.source),
        any(is(Field.Source.CUSTOM))
    );

    public highlightAsCustomCategory = () => this.category.source === 'custom'
        && this.settingsProvider.getSettings().highlightCustomElements;


    public getFields(): Array<Field> {

        const group: Group = this.category.groups.find(on(Named.NAME, is(this.selectedGroup)));
        if (!group) return [];

        return group.fields
            .filter(
                and(
                    on(Field.NAME, not(includedIn(this.permanentlyHiddenFields))),
                    or(
                        () => this.showHiddenFields,
                        not(ConfigurationDocument.isHidden(
                            this.getCustomCategoryDefinition(),
                            this.getParentCustomCategoryDefinition()
                        ))
                    )
                )
            );
    }


    public selectGroup(groupName: string) {

        if (!this.category) return;
        const group: Group = this.category.groups.find(on(Named.NAME, is(groupName)));
        groupName = group?.name ?? this.category.groups[0].name;

        this.selectedGroup = groupName;
        this.openedFieldName = undefined;
        this.configurationState.setSelectedGroupName(groupName);
    }


    public async addGroup() {

        const [result, componentInstance] = this.modals.make<AddGroupModalComponent>(
            AddGroupModalComponent,
            MenuContext.CONFIGURATION_MANAGEMENT
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = this.category;
        componentInstance.permanentlyHiddenFields = this.permanentlyHiddenFields;
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(result,
            groupName => this.selectGroup(groupName),
            nop
        );
    }


    public async addField() {

        const [result, componentInstance] = this.modals.make<AddFieldModalComponent>(
            AddFieldModalComponent,
            MenuContext.CONFIGURATION_MANAGEMENT,
            'lg'
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = this.category;
        componentInstance.groupName = this.selectedGroup;
        componentInstance.availableInputTypes = this.availableInputTypes;
        componentInstance.permanentlyHiddenFields = this.permanentlyHiddenFields;
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(result, nop, nop);
    }


    public startDraggingField() {

        this.draggingField = true;
        this.onDragging.emit(true);
    }


    public stopDraggingField() {

        this.draggingField = false;
        this.onDragging.emit(false);
    }


    public async onFieldDrop(event: CdkDragDrop<any>, targetGroup?: Group) {

        const groups: Array<GroupDefinition> = CategoryForm.getGroupsConfiguration(
            this.category, this.permanentlyHiddenFields
        );
        const selectedGroupDefinition: GroupDefinition = groups.find(group => group.name === this.selectedGroup);
        const selectedGroup: Group = this.category.groups.find(group => group.name === this.selectedGroup);

        if (targetGroup) {
            if (targetGroup.name === selectedGroupDefinition.name) return;
            const fieldName: string = selectedGroupDefinition.fields.splice(event.previousIndex, 1)[0];
            const targetGroupDefinition: GroupDefinition = groups.find(group => group.name === targetGroup.name);
            targetGroupDefinition.fields.push(fieldName);
            selectedGroup.fields.splice(event.previousIndex, 1)[0];
        } else {
            InPlace.moveInArray(selectedGroupDefinition.fields, event.previousIndex, event.currentIndex);
            InPlace.moveInArray(selectedGroup.fields, event.previousIndex, event.currentIndex);
        }

        await this.saveNewGroupsConfiguration(groups);
    }


    public async onGroupDrop(event: CdkDragDrop<any>) {

        const groups: Array<GroupDefinition> = CategoryForm.getGroupsConfiguration(
            this.category, this.permanentlyHiddenFields
        );
        InPlace.moveInArray(groups, event.previousIndex, event.currentIndex);
        InPlace.moveInArray(this.category.groups, event.previousIndex, event.currentIndex);

        await this.saveNewGroupsConfiguration(groups);
    }


    private async saveNewGroupsConfiguration(newGroups: Array<GroupDefinition>) {

        const clonedConfigurationDocument = Document.clone(this.configurationDocument);
        clonedConfigurationDocument.resource
            .forms[this.category.libraryId ?? this.category.name]
            .groups = newGroups;

        try {
            await this.applyChanges(clonedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            this.messages.add(errWithParams);
        }
    }


    private updateLabelAndDescription() {

        const { label, description } = this.labels.getLabelAndDescription(this.category);
        this.label = label;
        this.description = description;
    }
}

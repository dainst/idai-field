import { Component, Input, OnChanges, Output, SimpleChanges, EventEmitter } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { and, any, compose, flatten, includedIn, is, map, nop, not, on, or, Predicate, to } from 'tsfun';
import { Category, ConfigurationDocument, CustomCategoryDefinition, Field, Group, Named,
    Resource, Document, GroupDefinition, InPlace, Groups, Labels} from 'idai-field-core';
import { ConfigurationUtil, OVERRIDE_VISIBLE_FIELDS } from '../../core/configuration/configuration-util';
import { MenuContext } from '../services/menu-context';
import { AddFieldModalComponent } from './add/add-field-modal.component';
import { FieldEditorModalComponent } from './editor/field-editor-modal.component';
import { InputType } from './configuration.component';
import { Messages } from '../messages/messages';
import { AddGroupModalComponent } from './add/add-group-modal.component';
import { GroupEditorModalComponent } from './editor/group-editor-modal.component';
import { ConfigurationContextMenu } from './context-menu/configuration-context-menu';
import { ErrWithParams } from '../../core/import/import/import-documents';
import { Modals } from '../services/modals';


@Component({
    selector: 'configuration-category',
    templateUrl: './configuration-category.html'
})
/**
* @author Sebastian Cuy
* @author Thomas Kleinke
 */
export class ConfigurationCategoryComponent implements OnChanges {

    @Input() category: Category;
    @Input() configurationDocument: ConfigurationDocument;
    @Input() showHiddenFields: boolean = true;
    @Input() allowDragAndDrop: boolean = true;
    @Input() availableInputTypes: Array<InputType>;
    @Input() contextMenu: ConfigurationContextMenu;

    @Input() saveAndReload: (configurationDocument: ConfigurationDocument) =>
        Promise<ErrWithParams|undefined>;

    @Output() onEditCategory: EventEmitter<void> = new EventEmitter<void>();
    @Output() onEditGroup: EventEmitter<Group> = new EventEmitter<Group>();
    @Output() onEditField: EventEmitter<Field> = new EventEmitter<Field>();
    @Output() onDragging: EventEmitter<boolean> = new EventEmitter<boolean>();

    public selectedGroup: string;
    public label: string;
    public description: string;
    public openedFieldName: string;

    private permanentlyHiddenFields: string[];


    constructor(private modals: Modals,
                private messages: Messages,
                private labels: Labels) {}


    ngOnChanges(changes: SimpleChanges) {

        if (changes['category']) {
            if (!changes['category'].previousValue
                    || changes['category'].currentValue.name !== changes['category'].previousValue.name
                    || !this.category.groups.map(to(Named.NAME)).includes(this.selectedGroup)) {
                this.selectedGroup = this.category.groups[0].name;
            }
            this.permanentlyHiddenFields = this.getPermanentlyHiddenFields();
        }

        this.updateLabelAndDescription();
    }


    public getGroups = () => this.category.groups.filter(group => group.name !== Groups.HIDDEN_CORE_FIELDS);

    public getGroupLabel = (group: Group) => this.labels.get(group);

    public getGroupListIds = () => this.getGroups().map(group => 'group-' + group.name);

    public getCustomLanguageConfigurations = () => this.configurationDocument.resource.languages;

    public isHidden = (field: Field) =>
        ConfigurationUtil.isHidden(this.getCustomCategoryDefinition(), this.getParentCustomCategoryDefinition())(field);


    public getCustomCategoryDefinition(): CustomCategoryDefinition|undefined {

        return this.configurationDocument.resource.categories[this.category.libraryId ?? this.category.name];
    }


    public getParentCustomCategoryDefinition(): CustomCategoryDefinition|undefined {

        return this.category.parentCategory
            ? this.configurationDocument.resource
                .categories[this.category.libraryId ?? this.category.parentCategory.name]
            : undefined;
    }


    public hasCustomFields: Predicate<Group> = compose(
        to<Array<Field>>(Group.FIELDS),
        map(_ => _.source),
        any(is(Field.Source.CUSTOM))
    );


    public getFields(): Array<Field> {

        return this.getGroups()
            .find(on(Named.NAME, is(this.selectedGroup)))!
            .fields
            .filter(
                and(
                    on(Field.NAME, not(includedIn(this.permanentlyHiddenFields))),
                    or(
                        () => this.showHiddenFields,
                        not(ConfigurationUtil.isHidden(
                            this.getCustomCategoryDefinition(), this.getParentCustomCategoryDefinition()
                        ))
                    )
                )
            );
    }


    public async addGroup() {

        this.modals.setMenuContext(MenuContext.MODAL);

        const modalReference: NgbModalRef = this.modals.open(AddGroupModalComponent);

        try {
            await this.createNewGroup(await modalReference.result);
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.modals.resetMenuContext();
        }
    }


    public async addField() {

        this.modals.setMenuContext(MenuContext.MODAL);

        const modalReference: NgbModalRef = this.modals.open(AddFieldModalComponent);

        try {
            await this.createNewField(await modalReference.result);
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.modals.resetMenuContext();
        }
    }


    public async onFieldDrop(event: CdkDragDrop<any>, targetGroup?: Group) {

        const groups: Array<GroupDefinition> = ConfigurationUtil.createGroupsConfiguration(
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

        const groups: Array<GroupDefinition> = ConfigurationUtil.createGroupsConfiguration(
            this.category, this.permanentlyHiddenFields
        );
        InPlace.moveInArray(groups, event.previousIndex, event.currentIndex);
        InPlace.moveInArray(this.category.groups, event.previousIndex, event.currentIndex);

        await this.saveNewGroupsConfiguration(groups);
    }


    private async saveNewGroupsConfiguration(newGroups: Array<GroupDefinition>) {

        const clonedConfigurationDocument = Document.clone(this.configurationDocument);
        clonedConfigurationDocument.resource
            .categories[this.category.libraryId ?? this.category.name]
            .groups = newGroups;

        try {
            await this.saveAndReload(clonedConfigurationDocument);
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            this.messages.add(errWithParams);
        }
    }


    private async createNewField(fieldName: string) {

        const [result, componentInstance] =
            this.modals.make<FieldEditorModalComponent>(
                FieldEditorModalComponent,
                MenuContext.CONFIGURATION_EDIT,
                'lg'
            );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = this.category;
        componentInstance.field = {
            name: fieldName,
            inputType: 'input',
            label: {},
            defaultLabel: {},
            description: {},
            defaultDescription: {},
            source: 'custom'
        };
        componentInstance.groupName = this.selectedGroup;
        componentInstance.availableInputTypes = this.availableInputTypes;
        componentInstance.permanentlyHiddenFields = this.permanentlyHiddenFields;
        componentInstance.new = true;
        componentInstance.initialize();

        this.modals.awaitResult(result, nop, nop);
    }


    private async createNewGroup(groupName: string) {

        const [result, componentInstance] =
            this.modals.make<GroupEditorModalComponent>(
                GroupEditorModalComponent,
                MenuContext.CONFIGURATION_EDIT,
                'lg'
            );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.category = this.category;
        componentInstance.group = {
            name: groupName,
            label: {},
            defaultLabel: {},
            fields: [],
            relations: []
        } as any; // TODO review any; relations seems to be not defined in Group
        componentInstance.permanentlyHiddenFields = this.permanentlyHiddenFields;
        componentInstance.new = true;
        componentInstance.initialize();

        this.modals.awaitResult(result, nop, nop);
    }


    private updateLabelAndDescription() {

        const { label, description } = this.labels.getLabelAndDescription(this.category);
        this.label = label;
        this.description = description;
    }


    private getPermanentlyHiddenFields(): string[] {

        const result: string[] = flatten(this.getGroups().map(to('fields')))
            .filter(field => !field.visible
                && !OVERRIDE_VISIBLE_FIELDS.includes(field.name)
                && (this.category.source === 'custom' || !ConfigurationUtil.isHidden(
                    this.getCustomCategoryDefinition(),
                    this.getParentCustomCategoryDefinition()
                )(field)))
            .map(Named.toName);

        if (this.category.name === 'Project') result.push(Resource.IDENTIFIER);

        return result;
    }
}

import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { isUndefinedOrEmpty, clone, Map } from 'tsfun';
import { Condition, Document, Field, Group, Labels, Resource } from 'idai-field-core';
import { Language, Languages } from '../../../services/languages';
import { AngularUtility } from '../../../angular/angular-utility';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';


@Component({
    selector: 'edit-form',
    templateUrl: './edit-form.html',
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormComponent implements AfterViewInit, OnChanges {

    @ViewChild('editor', { static: false }) rootElement: ElementRef;

    @Input() document: Document;
    @Input() originalDocument: Document;
    @Input() fieldDefinitions: Array<Field>;
    @Input() originalGroups: Array<Group>;
    @Input() identifierPrefix: string|undefined;
    @Input() inspectedRevisions: Document[];
    @Input() activeGroup: string;
    @Input() scrollTargetField: string;
    @Input() disabledRelationFields: string[];

    public extraGroups: Array<Group> = [{ name: 'conflicts', fields: [] }];
    public groups: Array<Group> = [];
    public languages: Map<Language>;

    private conditionsFulfilled: Map<boolean> = {};


    constructor(private elementRef: ElementRef,
                private labels: Labels,
                private messages: Messages) {

        this.languages = Languages.getAvailableLanguages();
    }


    public activateGroup = (name: string) => this.activeGroup = name;

    public getGroupId = (group: Group) => 'edit-form-goto-' + group.name.replace(':', '-');


    async ngAfterViewInit() {

        await AngularUtility.refresh();
        if (!this.scrollTargetField) this.focusFirstInputElement();
    }


    ngOnChanges() {

        if (isUndefinedOrEmpty(this.originalGroups)) return;

        this.groups = [];
        for (const originalGroup of this.originalGroups) {
            const group = clone(originalGroup);
            this.groups.push(group);
        }
        this.groups = this.groups.concat(this.extraGroups);

        if (!this.shouldShow(this.activeGroup)) this.selectFirstNonEmptyGroup();    
        this.updateConditionsFulfilled();                  
    }


    /*
     * Called for changes in fields of input types "dropdown", "radio", "checkboxes" and "boolean"
     */
    public onChanged() {

        this.showDataDeletionWarningForUnfulfilledConditions();
        this.updateConditionsFulfilled();
    }


    public getLabel(group: Group): string {

        return group.name === 'conflicts'
            ? $localize `:@@docedit.group.conflicts:Konflikte`
            : this.labels.get(group);
    }


    public shouldShow(groupName: string) {

        return (groupName === 'conflicts' && this.document._conflicts)
            || this.getGroupFields(groupName).filter(field => {
                return field.editable
                    && Condition.isFulfilled(field.condition, this.document.resource, this.fieldDefinitions, 'field');
            }).length > 0;
    }


    public getGroupFields(groupName: string): Array<Field> {

        return this.groups.find((group: Group) => group.name === groupName).fields;
    }


    private updateConditionsFulfilled() {

        this.conditionsFulfilled = this.fieldDefinitions.reduce((result, field) => {
            result[field.name] = Condition.isFulfilled(
                field.condition, this.document.resource, this.fieldDefinitions, 'field'
            );
            return result;
        }, {});
    }


    private showDataDeletionWarningForUnfulfilledConditions() {

        const removedFields: string[] = this.fieldDefinitions.filter(field => {
            return this.conditionsFulfilled[field.name] && ! Condition.isFulfilled(
                field.condition, this.document.resource, this.fieldDefinitions, 'field'
            );
        }).filter(field => {
            return this.document.resource[field.name] !== undefined
                || this.document.resource.relations[field.name];
        }).map(field => this.labels.get(field));

        if (removedFields.length) {
            this.messages.add([M.DOCEDIT_WARNING_FIELD_DATA_DELETION, removedFields.join(', ')]);
        }
    }


    private selectFirstNonEmptyGroup() {

        this.activateGroup(this.groups.find((group: Group) => this.shouldShow(group.name))?.name ?? this.groups[0].name);
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement
            .getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}

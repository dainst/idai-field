import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { isUndefinedOrEmpty, clone } from 'tsfun';
import { Document, LabelUtil, ProjectConfiguration, FieldDefinition, RelationDefinition, Group,
    Groups, Relations, ProjectCategories } from 'idai-field-core';


@Component({
    selector: 'edit-form',
    templateUrl: './edit-form.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormComponent implements AfterViewInit, OnChanges {

    @ViewChild('editor', { static: false }) rootElement: ElementRef;

    @Input() document: any;
    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() originalGroups: Array<Group>;
    @Input() inspectedRevisions: Document[];
    @Input() activeGroup: string;

    public categories: string[];

    public extraGroups: Array<Group> = [
        { name: 'conflicts', fields: [] }
    ];

    public groups: Array<Group> = [];
    

    constructor(private elementRef: ElementRef,
                private i18n: I18n,
                private projectConfiguration: ProjectConfiguration) {}


    public activateGroup = (name: string) => this.activeGroup = name;


    ngAfterViewInit() {

        this.focusFirstInputElement();
    }


    ngOnChanges() {

        if (isUndefinedOrEmpty(this.originalGroups)) return;

        this.groups = [];
        for (const originalGroup of this.originalGroups) {
            const group = clone(originalGroup);
            this.groups.push(group);
        }
        this.groups = this.groups.concat(this.extraGroups);
    }


    public getLabel(group: Group): string {

        return group.name === 'conflicts'
            ? this.i18n({ id: 'docedit.group.conflicts', value: 'Konflikte' })
            : LabelUtil.getLabel(group);
    }
    

    public shouldShow(groupName: string) {

        return (groupName === 'images'
                && !ProjectCategories.getImageCategoryNames(
                    this.projectConfiguration.getCategoryForest()).includes(this.document.resource.category))
            || (groupName === 'conflicts' && this.document._conflicts)
            || this.getFieldDefinitions(groupName).filter(field => field.editable).length > 0;
    }


    public getFieldDefinitions(groupName: string): Array<FieldDefinition> {

        return this.groups.find((group: Group) => group.name === groupName).fields;
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement
            .getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}

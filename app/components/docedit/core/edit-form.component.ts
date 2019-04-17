import {AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {Document, FieldDefinition, RelationDefinition} from 'idai-components-2';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {jsonClone} from 'tsfun/src/objectstruct';
import {GroupsConfiguration} from '../../../groups-configuration';
import GroupDefinition = GroupsConfiguration.GroupDefinition;


@Component({
    moduleId: module.id,
    selector: 'edit-form',
    templateUrl: './edit-form.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormComponent implements AfterViewInit, OnChanges {

    @ViewChild('editor') rootElement: ElementRef;

    public activeGroup: string = 'stem';

    @Input() document: any;
    @Input() label: string;
    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() inspectedRevisions: Document[];


    public types: string[];

    public groups: GroupDefinition[] = [];


    constructor(private elementRef: ElementRef, private i18n: I18n) {

        this.groups = jsonClone(GroupsConfiguration.groups);
    }

    public activateGroup = (name: string) => this.activeGroup = name;


    public shouldShow(groupName: string) {

        return groupName === 'images'
            || (groupName === 'conflicts' && this.document._conflicts)
            || this.getFieldDefinitions(groupName).length > 0
            || this.getRelationDefinitions(groupName).length > 0;
    }


    public getFieldDefinitions = (groupName: string) => {

        return (this.groups.find((gd: GroupDefinition) => gd.name === groupName) as any).fields;
    };


    public getRelationDefinitions = (groupName: string) => {

        return (this.groups.find((gd: GroupDefinition) => gd.name === groupName) as any).relations;
    };



    ngAfterViewInit() {

        this.focusFirstInputElement();
    }


    ngOnChanges(changes: any) {

        GroupsConfiguration.configure(this.groups, this.fieldDefinitions, this.relationDefinitions, this.i18n);
        // this.focusFirstInputElement();
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
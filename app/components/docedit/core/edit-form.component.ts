import {AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {includedIn, is, isNot, on, undefinedOrEmpty} from 'tsfun';
import {Document, FieldDefinition, RelationDefinition, ProjectConfiguration,
    IdaiType} from 'idai-components-2';
import {TypeUtility} from '../../../core/model/type-utility';
import {GroupUtil} from '../../../core/util/group-util';
import {GROUP_NAME, POSITION_RELATIONS, TIME_RELATIONS} from '../../../c';


interface GroupDefinition {

    name: string;
    label: string;
    fields: any[];
    relations: any[];
    widget: string|undefined;
}


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

    @Input() document: any;
    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() inspectedRevisions: Document[];
    @Input() activeGroup: string;


    public types: string[];

    public groups: Array<GroupDefinition> = [
        { name: 'stem', label: this.i18n({ id: 'docedit.group.stem', value: 'Stammdaten' }), fields: [],
            relations: [], widget: 'generic' },
        { name: 'properties', label: '', fields: [], relations: [], widget: 'generic' },
        { name: 'childProperties', label: '', fields: [], relations: [], widget: 'generic' },
        { name: 'dimension', label: this.i18n({ id: 'docedit.group.dimensions', value: 'Maße' }),
            fields: [], relations: [], widget: 'generic' },
        { name: 'position', label: this.i18n({ id: 'docedit.group.position', value: 'Lage' }),
            fields: [], relations: [], widget: 'generic' },
        { name: 'time', label: this.i18n({ id: 'docedit.group.time', value: 'Zeit' }), fields: [],
            relations: [], widget: 'generic' },
        { name: 'images', label: this.i18n({ id: 'docedit.group.images', value: 'Bilder' }), fields: [],
            relations: [], widget: undefined },
        { name: 'conflicts', label: this.i18n({ id: 'docedit.group.conflicts', value: 'Konflikte' }),
            fields: [], relations: [], widget: undefined } ];


    constructor(private elementRef: ElementRef,
                private i18n: I18n,
                private projectConfiguration: ProjectConfiguration,
                private typeUtility: TypeUtility) {}

    public activateGroup = (name: string) => this.activeGroup = name;


    public shouldShow(groupName: string) {

        return (groupName === 'images'
                && !this.typeUtility.getImageTypeNames().includes(this.document.resource.type))
            || (groupName === 'conflicts' && this.document._conflicts)
            || this.getFieldDefinitions(groupName).length > 0
            || this.getRelationDefinitions(groupName).length > 0;
    }


    public getFieldDefinitions(groupName: string): Array<FieldDefinition> {

        return (this.groups.find((gd: GroupDefinition) => gd.name === groupName) as any).fields;
    }


    public getRelationDefinitions(groupName: string): Array<RelationDefinition> {

        return (this.groups.find((gd: GroupDefinition) => gd.name === groupName) as any).relations;
    }


    ngAfterViewInit() {

        this.focusFirstInputElement();
    }


    ngOnChanges() {

        this.setLabels();

        if (isNot(undefinedOrEmpty)(this.fieldDefinitions)) {
            this.setFields();
            GroupUtil.sortGroups(this.groups[GROUP_NAME.STEM].fields, 'stem');
            GroupUtil.sortGroups(this.groups[GROUP_NAME.DIMENSION].fields, 'dimension');
        }

        if (isNot(undefinedOrEmpty)(this.relationDefinitions)) {
            this.setRelations();
        }
        // this.focusFirstInputElement();
    }


    private setRelations() {

        this.groups[GROUP_NAME.POSITION].relations =
            this.relationDefinitions.filter(on('name', includedIn(POSITION_RELATIONS)));
        this.groups[GROUP_NAME.TIME].relations =
            this.relationDefinitions.filter(on('name', includedIn(TIME_RELATIONS)));
    }


    private setFields() {

        this.groups[GROUP_NAME.STEM].fields = this.fieldDefinitions.filter(on('group', is('stem')));
        this.groups[GROUP_NAME.PROPERTIES].fields = this.fieldDefinitions.filter(on('group', is(undefined)));
        this.groups[GROUP_NAME.CHILD_PROPERTIES].fields = this.fieldDefinitions.filter(on('group', is('child')));
        this.groups[GROUP_NAME.DIMENSION].fields = this.fieldDefinitions.filter(on('group', is('dimension')));
        this.groups[GROUP_NAME.POSITION].fields = this.fieldDefinitions.filter(on('group', is('position')));
        this.groups[GROUP_NAME.POSITION].fields.push({
            name: 'geometry',
            label: this.i18n({ id: 'docedit.geometry', value: 'Geometrie' }),
            group: 'position',
            inputType: 'geometry',
            editable: true
        });
        this.groups[GROUP_NAME.TIME].fields = this.fieldDefinitions.filter(on('group', is('time')));
    }


    private setLabels() {

        const type: IdaiType = this.projectConfiguration.getTypesMap()[this.document.resource.type];
        if (type.parentType) {
            this.groups[GROUP_NAME.PROPERTIES].label = type.parentType.label;
            this.groups[GROUP_NAME.CHILD_PROPERTIES].label = type.label;
        } else {
            this.groups[GROUP_NAME.PROPERTIES].label = type.label;
        }
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
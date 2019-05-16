import {AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {includedIn, is, isNot, on, undefinedOrEmpty} from 'tsfun';
import {Document, FieldDefinition, RelationDefinition, ProjectConfiguration,
    IdaiType} from 'idai-components-2';
import {TypeUtility} from '../../../core/model/type-utility';
import {GroupUtil} from '../../../core/util/group-util';


const STEM = 0;
const PROPERTIES = 1;
const CHILD_PROPERTIES = 2;
const DIMENSIONS = 3;
const POSITION = 4;
const TIME = 5;


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
        { name: 'dimensions', label: this.i18n({ id: 'docedit.group.dimensions', value: 'Maße' }),
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
            GroupUtil.sortGroups(this.groups);
        }

        if (isNot(undefinedOrEmpty)(this.relationDefinitions)) {
            this.setRelations();
        }
        // this.focusFirstInputElement();
    }


    private setRelations() {

        this.groups[POSITION].relations = this.relationDefinitions
            .filter(on('name', includedIn(['borders', 'cuts', 'isCutBy', 'isAbove', 'isBelow'])));
        this.groups[TIME].relations = this.relationDefinitions
            .filter(on('name', includedIn(['isAfter', 'isBefore', 'isContemporaryWith'])));
    }


    private setFields() {

        this.groups[STEM].fields = this.fieldDefinitions.filter(on('group', is('stem')));
        this.groups[PROPERTIES].fields = this.fieldDefinitions.filter(on('group', is(undefined)));
        this.groups[CHILD_PROPERTIES].fields = this.fieldDefinitions.filter(on('group', is('child')));
        this.groups[DIMENSIONS].fields = this.fieldDefinitions.filter(on('group', is('dimension')));
        this.groups[POSITION].fields = this.fieldDefinitions.filter(on('group', is('position')));
        this.groups[POSITION].fields.push({
            name: 'geometry',
            label: this.i18n({ id: 'docedit.geometry', value: 'Geometrie' }),
            group: 'position',
            inputType: 'geometry',
            editable: true
        });
        this.groups[TIME].fields = this.fieldDefinitions.filter(on('group', is('time')));
    }


    private setLabels() {

        const type: IdaiType = this.projectConfiguration.getTypesMap()[this.document.resource.type];
        if (type.parentType) {
            this.groups[PROPERTIES].label = type.parentType.label;
            this.groups[CHILD_PROPERTIES].label = type.label;
        } else {
            this.groups[PROPERTIES].label = type.label;
        }
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
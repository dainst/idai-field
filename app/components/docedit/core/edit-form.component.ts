import {AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {Document, FieldDefinition, RelationDefinition} from 'idai-components-2';
import {includedIn, is, isNot, on, undefinedOrEmpty} from 'tsfun';
import {I18n} from '@ngx-translate/i18n-polyfill';


const STEM = 0;
const PROPERTIES = 1;
const CHILD_PROPERTIES = 2;
const DIMENSIONS = 3;
const POSITION = 4;
const TIME = 5;
const IMAGES = 6;
const CONFLICTS = 7;


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

    public activeGroup: string = 'stem';

    @Input() document: any;
    @Input() label: string;
    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() inspectedRevisions: Document[];


    public types: string[];

    public groups: GroupDefinition[] = [
        { name: 'stem', label: 'Stammdaten', fields: [], relations: [], widget: 'generic'},
        { name: 'properties', label: 'Eigenschaften', fields: [], relations: [], widget: 'generic'},
        { name: 'childProperties', label: 'Eigenschaften speziell', fields: [], relations: [], widget: 'generic'},
        { name: 'dimensions', label: 'Maße', fields: [], relations: [], widget: 'generic'},
        { name: 'position', label: 'Lage', fields: [], relations: [], widget: 'generic'},
        { name: 'time', label: 'Zeit', fields: [], relations: [], widget: 'generic'},
        { name: 'images', label: 'Bilder', fields: [], relations: [], widget: undefined},
        { name: 'conflicts', label: 'Konflikte', fields: [], relations: [], widget: undefined}];


    constructor(private elementRef: ElementRef, private i18n: I18n) {}

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

        this.setLabels();

        if (isNot(undefinedOrEmpty)(this.fieldDefinitions)) {

            this.setFields();
            this.sortGroups();
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
        this.groups[TIME].fields = this.fieldDefinitions.filter(on('group', is('time')));
    }



    private setLabels() {

        this.groups[STEM].label = this.i18n({ id: 'docedit.group.stem', value: 'Stammdaten' });
        this.groups[PROPERTIES].label = this.i18n({ id: 'docedit.group.properties', value: 'Eigenschaften' });
        if (this.label) this.groups[CHILD_PROPERTIES].label = this.label;
        this.groups[DIMENSIONS].label = this.i18n({ id: 'docedit.group.dimensions', value: 'Maße' });
        this.groups[POSITION].label = this.i18n({ id: 'docedit.group.position', value: 'Lage' });
        this.groups[TIME].label = this.i18n({ id: 'docedit.group.time', value: 'Zeit' });
        this.groups[IMAGES].label = this.i18n({ id: 'docedit.group.images', value: 'Bilder' });
        this.groups[CONFLICTS].label = this.i18n({ id: 'docedit.group.conflicts', value: 'Konflikte' });
    }


    private sortGroups() {

        this.sortGroup(this.groups[STEM].fields, ['identifier', 'shortDescription',
            'processor', 'description', 'diary', 'date', 'beginningDate', 'endDate']);
        this.sortGroup(this.groups[DIMENSIONS].fields, ['dimensionHeight',
            'dimensionLength', 'dimensionWidth', 'dimensionPerimeter',
            'dimensionDiameter', 'dimensionThickness', 'dimensionVerticalExtent', 'dimensionOther']);
    }


    /**
     * Fields not defined via 'order' are not considered
     */
    private sortGroup(fds: Array<FieldDefinition>, order: string[]) {

        const temp = fds;
        const l = temp.length;
        for (let fieldName of order) {

            const got = temp.find((fd: FieldDefinition) => fd.name === fieldName);
            if (got) temp.push(got);

        }
        fds.splice(0, l);
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
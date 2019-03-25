import {Component, Input, AfterViewInit, OnChanges, ElementRef, ViewChild} from '@angular/core';
import {Document, FieldDefinition, RelationDefinition} from 'idai-components-2';
import {is, isNot, on, undefinedOrEmpty, includedIn, isnt, tripleEqual, filter} from 'tsfun';
import {I18n} from '@ngx-translate/i18n-polyfill';


const STEM = 0;
const PROPERTIES = 1;
const DIMENSIONS = 2;
const SPACE = 3;
const TIME = 4;
const IMAGES = 5;
const CONFLICTS = 6;


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
    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() inspectedRevisions: Document[];


    public types: string[];

    public groups: GroupDefinition[] = [
        { name: 'stem', label: 'Stammdaten', fields: [], relations: [], widget: 'generic'},
        { name: 'properties', label: 'Eigenschaften', fields: [], relations: [], widget: 'generic'},
        { name: 'dimensions', label: 'Maße', fields: [], relations: [], widget: 'generic'},
        { name: 'space', label: 'Lage', fields: [], relations: [], widget: 'generic'},
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

        this.groups[STEM].label = this.i18n({ id: 'docedit.group.stem', value: 'Stammdaten' });
        this.groups[PROPERTIES].label = this.i18n({ id: 'docedit.group.properties', value: 'Eigenschaften' });
        this.groups[DIMENSIONS].label = this.i18n({ id: 'docedit.group.dimensions', value: 'Maße' });
        this.groups[SPACE].label = this.i18n({ id: 'docedit.group.space', value: 'Lage' });
        this.groups[TIME].label = this.i18n({ id: 'docedit.group.time', value: 'Zeit' });
        this.groups[IMAGES].label = this.i18n({ id: 'docedit.group.images', value: 'Bilder' });
        this.groups[CONFLICTS].label = this.i18n({ id: 'docedit.group.conflicts', value: 'Konflikte' });

        if (isNot(undefinedOrEmpty)(this.fieldDefinitions)) {

            this.groups[STEM].fields = this.fieldDefinitions.filter(on('group', is('stem')));
            this.groups[PROPERTIES].fields = this.fieldDefinitions.filter(on('group', is(undefined)));
            this.groups[DIMENSIONS].fields = this.fieldDefinitions.filter(on('group', is('dimension')));
            this.groups[SPACE].fields = this.fieldDefinitions.filter(on('group', is('space')));
            this.groups[TIME].fields = this.fieldDefinitions.filter(on('group', is('time')));
        }

        if (isNot(undefinedOrEmpty)(this.relationDefinitions)) {

            this.groups[SPACE].relations = this.relationDefinitions
                .filter(on('name', isNot(includedIn(['isAfter', 'isBefore', 'isContemporaryWith', 'includes', 'liesWithin']))));
            this.groups[TIME].relations = this.relationDefinitions
                .filter(on('name', isNot(includedIn(['includes', 'borders', 'cuts', 'isCutBy', 'isAbove', 'isBelow']))));
        }
        // this.focusFirstInputElement();
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
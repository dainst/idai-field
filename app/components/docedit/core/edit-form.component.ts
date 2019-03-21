import {Component, Input, AfterViewInit, OnChanges, ElementRef, ViewChild} from '@angular/core';
import {Document, FieldDefinition, RelationDefinition} from 'idai-components-2';
import {is, isNot, on, undefinedOrEmpty, includedIn, isnt, tripleEqual, filter} from 'tsfun';


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

    public activeGroup: string = 'basic';

    @Input() document: any;
    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() inspectedRevisions: Document[];

    public types: string[];

    public groups: GroupDefinition[] = [
        { name: 'basic', label: 'Stammdaten', fields: [], relations: [], widget: 'generic'},
        { name: 'properties', label: 'Eigenschaften', fields: [], relations: [], widget: 'generic'},
        { name: 'dimension', label: 'Maße', fields: [], relations: [], widget: 'generic'},
        { name: 'space', label: 'Lage', fields: [], relations: [], widget: 'generic'},
        { name: 'time', label: 'Zeit', fields: [], relations: [], widget: 'generic'},
        { name: 'images', label: 'Bilder', fields: [], relations: [], widget: undefined},
        { name: 'conflicts', label: 'Konflikte', fields: [], relations: [], widget: undefined}];


    constructor(private elementRef: ElementRef) {}


    public getFieldDefinitions = () => (this.groups.find((g: GroupDefinition) => g.name === this.activeGroup) as any).fields;

    public getRelationDefinitions = () => (this.groups.find((g: GroupDefinition) => g.name === this.activeGroup) as any).relations;

    public activateGroup = (name: string) => this.activeGroup = name;

    ngAfterViewInit() {

        this.focusFirstInputElement();
    }


    ngOnChanges(changes: any) {

        if (isNot(undefinedOrEmpty)(this.fieldDefinitions)) {

            this.groups[0].fields = this.fieldDefinitions.filter(on('group', is('stem')));
            this.groups[1].fields = this.fieldDefinitions.filter(on('group', is(undefined)));
            this.groups[2].fields = this.fieldDefinitions.filter(on('group', is('dimension')));
            this.groups[3].fields = this.fieldDefinitions.filter(on('group', is('space')));
            this.groups[4].fields = this.fieldDefinitions.filter(on('group', is('time')));
        }

        if (isNot(undefinedOrEmpty)(this.relationDefinitions)) {

            this.groups[3].relations = this.relationDefinitions
                .filter(on('name', isNot(includedIn(['isAfter', 'isBefore', 'isContemporaryWith', 'includes', 'liesWithin']))));
            this.groups[4].relations = this.relationDefinitions
                .filter(on('name', isNot(includedIn(['includes', 'borders', 'cuts', 'isCutBy', 'isAbove', 'isBelow']))));
        }
        // this.focusFirstInputElement();
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
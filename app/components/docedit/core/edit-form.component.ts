import {Component, Input, AfterViewInit, OnChanges, ElementRef, ViewChild} from '@angular/core';
import {Document, FieldDefinition, RelationDefinition} from 'idai-components-2';
import {is, isNot, on, undefinedOrEmpty, includedIn, isnt, tripleEqual, filter} from 'tsfun';


interface GroupDefinition {

    name: string;
    label: string;
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

    @ViewChild('ed') rootElement: ElementRef;

    public activeGroup: string = 'basic';

    @Input() document: any;
    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() relationDefinitions: Array<RelationDefinition>;
    @Input() inspectedRevisions: Document[];

    public basicFieldsToShow: Array<FieldDefinition> = [];
    public propertiesFieldsToShow: Array<FieldDefinition> = [];
    public dimensionFieldsToShow: Array<FieldDefinition> = [];

    public spatialFieldsToShow: Array<FieldDefinition> = [];
    public spatialRelationsToShow: Array<RelationDefinition> = [];

    public timeFieldsToShow: Array<FieldDefinition> = [];
    public timeRelationsToShow: Array<RelationDefinition> = [];


    public types: string[];

    public groups: GroupDefinition[] = [
        { name: 'basic', label: 'Stammdaten'},
        { name: 'properties', label: 'Eigenschaften' },
        { name: 'dimension', label: 'Maße' },
        { name: 'space', label: 'Lage' },
        { name: 'time', label: 'Zeit' },
        { name: 'images', label: 'Bilder' },
        { name: 'conflicts', label: 'Konflikte' }];


    constructor(private elementRef: ElementRef) {}


    public activateGroup = (name: string) => this.activeGroup = name;



    ngAfterViewInit() {

        this.focusFirstInputElement();
    }


    ngOnChanges(changes: any) {

        if (isNot(undefinedOrEmpty)(this.fieldDefinitions)) {

            this.basicFieldsToShow = this.fieldDefinitions.filter(on('group', is('stem')));
            this.dimensionFieldsToShow = this.fieldDefinitions.filter(on('group', is('dimension')));
            this.propertiesFieldsToShow = this.fieldDefinitions.filter(on('group', is(undefined)));
            this.spatialFieldsToShow = this.fieldDefinitions.filter(on('group', is('space')));
            this.timeFieldsToShow = this.fieldDefinitions.filter(on('group', is('time')));
        }

        if (isNot(undefinedOrEmpty)(this.relationDefinitions)) {

            this.spatialRelationsToShow = this.relationDefinitions
                .filter(on('name', isNot(includedIn(['isAfter', 'isBefore', 'isContemporaryWith', 'includes', 'liesWithin']))));

            this.timeRelationsToShow = this.relationDefinitions
                .filter(on('name', isNot(includedIn(['includes', 'borders', 'cuts', 'isCutBy', 'isAbove', 'isBelow']))));
        }

        // this.focusFirstInputElement();
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
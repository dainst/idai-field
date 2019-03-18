import {Component, Input, AfterViewInit, OnChanges, ElementRef, ViewChild} from '@angular/core';
import {FieldDefinition, RelationDefinition} from 'idai-components-2';
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

        const basicFields = ['identifier', 'shortDescription', 'diary', 'processor', 'beginningDate', 'endDate', 'date', 'description'];
        const dimensionFields = ['dimensionThickness', 'dimensionVerticalExtent', 'dimensionWidth', 'dimensionHeight', 'dimensionLength'];

        if (isNot(undefinedOrEmpty)(this.fieldDefinitions)) {

            this.basicFieldsToShow = this.fieldDefinitions.filter(on('name', includedIn(basicFields)));
            this.dimensionFieldsToShow = this.fieldDefinitions.filter(on('name', includedIn(dimensionFields)));

            this.propertiesFieldsToShow =
                this.fieldDefinitions
                    .filter(on('group', is(undefined)))
                    .filter(on('name', isnt('period')))
                    .filter(on('name', isnt('shortDescription')))
                    .filter(on('name', isNot(includedIn(basicFields))))
                    .filter(on('name', isNot(includedIn(dimensionFields))));

            this.spatialFieldsToShow =
                this.fieldDefinitions.filter(on('group', is('space')));

            this.timeFieldsToShow =
                this.fieldDefinitions.filter(on('group', is('time'))).concat(
                    this.fieldDefinitions.filter(on('name', is('period')))
                );
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
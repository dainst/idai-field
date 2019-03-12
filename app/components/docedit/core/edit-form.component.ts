import {Component, Input, AfterViewInit, OnChanges, ElementRef, ViewChild} from '@angular/core';
import {FieldDefinition, RelationDefinition} from 'idai-components-2';
import {is, isNot, on, undefinedOrEmpty, includedIn, isnt} from 'tsfun';
import {Chapter} from '../../help/help-loader';


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

    private static headerTopOffset: number = -240;
    private static scrollOffset: number = -20;

    @Input() document: any;
    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() relationDefinitions: Array<RelationDefinition>;

    public fieldsToShow: Array<FieldDefinition> = [];

    public spatialFieldsToShow: Array<FieldDefinition> = [];
    public spatialRelationsToShow: Array<RelationDefinition> = [];

    public timeFieldsToShow: Array<FieldDefinition> = [];
    public timeRelationsToShow: Array<RelationDefinition> = [];


    public types: string[];

    public groups: string[] = ['basic', 'space', 'time'];


    constructor(private elementRef: ElementRef) {}


    ngAfterViewInit() {

        this.focusFirstInputElement();
    }


    ngOnChanges() {

        if (isNot(undefinedOrEmpty)(this.fieldDefinitions)) {

            this.fieldsToShow =
                this.fieldDefinitions
                    .filter(on('group', is(undefined)))
                    .filter(on('name', isnt('period')));

            this.spatialFieldsToShow =
                this.fieldDefinitions.filter(on('group', is('space')));

            this.timeFieldsToShow =
                this.fieldDefinitions.filter(on('group', is('time'))).concat(
                    this.fieldDefinitions.filter(on('name', is('period')))
                );
        }

        if (isNot(undefinedOrEmpty)(this.relationDefinitions)) {

            this.spatialRelationsToShow = this.relationDefinitions
                .filter(on('name', isNot(includedIn(['isAfter', 'isBefore', 'isContemporaryWith']))));

            this.timeRelationsToShow = this.relationDefinitions
                .filter(on('name', isNot(includedIn(['includes', 'borders', 'cuts', 'isCutBy', 'isAbove', 'isBelow']))));
        }

        // this.focusFirstInputElement();
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }


    public scrollToGroup(g: string) {

        const element: HTMLElement|null = document.getElementById(g + '-group');
        if (!element) return;

        element.scrollIntoView(true);
        this.rootElement.nativeElement.scrollTop += EditFormComponent.scrollOffset;
    }


    public updateActiveGroup() {

        let activeElementTop: number = 1;

        this.groups.forEach(group => {
            const top: number = EditFormComponent.getHeaderTop(group);
            if (top <= 0 && (top > activeElementTop || activeElementTop === 1)) {
                activeElementTop = top;
                this.activeGroup = group;
            }
        });
    }


    private static getHeaderTop(group: string): number {

        const element: HTMLElement|null = document.getElementById(group + '-group');
        if (!element) return 1;

        return element.getBoundingClientRect().top
            + EditFormComponent.headerTopOffset
            + EditFormComponent.scrollOffset;
    }
}
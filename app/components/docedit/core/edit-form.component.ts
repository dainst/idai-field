import {Component, Input, AfterViewInit, OnChanges, ElementRef} from '@angular/core';
import {FieldDefinition} from 'idai-components-2';
import {is, isNot, on, undefinedOrEmpty, includedIn, isnt} from 'tsfun';


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

    @Input() document: any;
    @Input() fieldDefinitions: Array<FieldDefinition>;

    public fieldsToShow: Array<FieldDefinition> = [];


    public types: string[];


    constructor(
        private elementRef: ElementRef
    ) {}


    ngAfterViewInit() {

        this.focusFirstInputElement();
    }


    ngOnChanges() {

        if (isNot(undefinedOrEmpty)(this.fieldDefinitions)) {
            this.fieldsToShow =
                this.fieldDefinitions
                    .filter(on('group', is(undefined)))
                    .filter(on('name', isnt('period')))
        }

        this.focusFirstInputElement();
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
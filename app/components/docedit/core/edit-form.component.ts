import {Component, Input, AfterViewInit, OnChanges, ElementRef} from '@angular/core';
import {FieldDefinition} from 'idai-components-2';


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

    public types: string[];


    constructor(
        private elementRef: ElementRef
    ) {}


    ngAfterViewInit() {

        this.focusFirstInputElement();
    }


    ngOnChanges() {

        this.focusFirstInputElement();
    }


    private focusFirstInputElement() {

        const inputElements: Array<HTMLElement> = this.elementRef.nativeElement.getElementsByTagName('input');
        if (inputElements.length > 0) inputElements[0].focus();
    }
}
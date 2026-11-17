import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';



@Component({
    selector: 'identifier-input',
    templateUrl: './identifier-input.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class IdentifierInputComponent implements OnChanges {

    @Input() fieldContainer: any;
    @Input() fieldName: string;
    @Input() identifierPrefix: string|undefined;
    @Input() highlightOnFocus: boolean = true;
    
    @Output() onFocus: EventEmitter<void> = new EventEmitter<void>();
    @Output() onBlur: EventEmitter<void> = new EventEmitter<void>();
    @Output() onKeyUp: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();

    @ViewChild('inputField') inputFieldElement: ElementRef;

    public identifierBody: string|undefined;
    public invalidIdentifier: boolean = false;
    public currentIdentifier: string;
    public focused: boolean = false;


    ngOnChanges() {

        this.currentIdentifier = this.fieldContainer[this.fieldName];
        this.updateIdentifierBody();
    }


    public update() {

        const trimmedIdentifierBody: string = this.identifierBody.trim();

        if (trimmedIdentifierBody === '') {
            delete this.fieldContainer[this.fieldName];
        } else {
            this.fieldContainer[this.fieldName] = this.identifierPrefix
                ? this.identifierPrefix + trimmedIdentifierBody
                : trimmedIdentifierBody;
        }
    }


    public focusInputField() {

        this.inputFieldElement.nativeElement.focus();
    }


    private updateIdentifierBody() {

        this.invalidIdentifier = false;

        const fieldContent: string = this.fieldContainer[this.fieldName];
        if (!this.identifierPrefix || !fieldContent) {
            this.identifierBody = fieldContent;
        } else if (fieldContent.startsWith(this.identifierPrefix)) {
            this.identifierBody = fieldContent.replace(this.identifierPrefix, '');
        } else {
            this.invalidIdentifier = true;
            this.identifierBody = undefined;
        }
    }
}

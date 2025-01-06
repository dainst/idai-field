import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';


@Component({
    selector: 'form-field-identifier',
    templateUrl: './identifier.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class IdentifierComponent implements OnChanges {

    @Input() fieldContainer: any;
    @Input() fieldName: string;
    @Input() identifierPrefix: string|undefined;

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

        if (this.identifierBody === '') {
            delete this.fieldContainer[this.fieldName];
        } else {
            this.fieldContainer[this.fieldName] = this.identifierPrefix
                ? this.identifierPrefix + this.identifierBody
                : this.identifierBody;
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

import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { Resource } from 'idai-field-core';


@Component({
    selector: 'form-field-identifier',
    templateUrl: './identifier.html'
})
/**
 * @author Thomas Kleinke
 */
export class IdentifierComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() fieldName: string;
    @Input() identifierPrefix: string|undefined;

    @ViewChild('inputField') inputFieldElement: ElementRef;

    public identifierBody: string|undefined;
    public invalidIdentifier: boolean = false;
    public currentIdentifier: string;
    public focused: boolean = false;


    ngOnChanges() {

        this.currentIdentifier = this.resource[this.fieldName];
        this.updateIdentifierBody();
    }


    public update(value: string) {

        if (value === '') {
            delete this.resource[this.fieldName];
        } else {
            this.resource[this.fieldName] = this.identifierPrefix
                ? this.identifierPrefix + value
                : value;
        }
    }


    public focusInputField() {

        this.inputFieldElement.nativeElement.focus();
    }


    private updateIdentifierBody() {

        this.invalidIdentifier = false;

        const fieldContent: string = this.resource[this.fieldName];
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

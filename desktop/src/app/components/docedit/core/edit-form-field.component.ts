import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Map } from 'tsfun';
import { Resource, Field, Subfield } from 'idai-field-core';
import { Language } from '../../../services/languages';


@Component({
    selector: 'edit-form-field',
    templateUrl: './edit-form-field.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class EditFormFieldComponent {

    @Input() resource: Resource;
    
    // In most cases the resource is used as the field container. For fields of input type "composite", the
    // field container is an entry object of the field data array.
    @Input() fieldContainer: any;
    
    @Input() field: Field|Subfield;
    @Input() languages: Map<Language>;
    @Input() identifierPrefix: string|undefined;
    @Input() disabled: boolean;

    // Detects changes for input types "dropdown", "radio", "checkboxes" and "boolean"
    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>(); 
}

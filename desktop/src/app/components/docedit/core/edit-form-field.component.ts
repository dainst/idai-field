import { Component, Input } from '@angular/core';
import { Map } from 'tsfun';
import { Resource, Field, Subfield } from 'idai-field-core';
import { Language } from '../../../services/languages';


@Component({
    selector: 'edit-form-field',
    templateUrl: './edit-form-field.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class EditFormFieldComponent {

    @Input() resource: Resource;
    
    // In most cases the resource is used as the field container. For fields of input type "complex", the
    // field container is an entry object of the field data array.
    @Input() fieldContainer: any;
    
    @Input() field: Field|Subfield;
    @Input() languages: Map<Language>;
    @Input() identifierPrefix: string|undefined;
}

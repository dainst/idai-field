import { Component, Input } from '@angular/core';
import { Field, Labels } from 'idai-field-core';
import { ConfigurationUtil, InputType } from '../../configuration-util';


@Component({
    selector: 'field-preview',
    templateUrl: './field-preview.html'
})
/**
 * @author Thomas Kleinke
 */
export class FieldPreviewComponent {

    @Input() field: Field|undefined;
    @Input() availableInputTypes: Array<InputType>;

    public label: string;
    public description: string;


    constructor(private labels: Labels) {}


    public getLabel = (value: any) => this.labels.get(value);

    
    public getInputTypeLabel = () => ConfigurationUtil.getInputTypeLabel(
        this.field.inputType, this.availableInputTypes
    );
}

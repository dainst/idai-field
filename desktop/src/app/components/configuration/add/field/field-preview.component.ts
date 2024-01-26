import { Component, Input } from '@angular/core';
import { Field, Labels } from 'idai-field-core';
import { InputType } from '../../configuration-util';
import { getInputTypeLabel } from '../../../../util/get-input-type-label';
import { UtilTranslations } from '../../../../util/util-translations';


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


    constructor(private labels: Labels,
                private utilTranslations: UtilTranslations) {}


    public getLabel = (value: any) => this.labels.get(value);

    
    public getInputTypeLabel = () => getInputTypeLabel(this.field.inputType, this.utilTranslations);
}

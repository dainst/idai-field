import { Component, Input, OnChanges } from '@angular/core';
import { Field, Labels } from 'idai-field-core';
import { InputType } from '../../configuration-util';
import { getInputTypeLabel } from '../../../../util/get-input-type-label';
import { UtilTranslations } from '../../../../util/util-translations';


@Component({
    selector: 'field-preview',
    templateUrl: './field-preview.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class FieldPreviewComponent implements OnChanges {

    @Input() field: Field|undefined;
    @Input() availableInputTypes: Array<InputType>;

    public label: string;
    public description: string;


    constructor(private labels: Labels,
                private utilTranslations: UtilTranslations) {}

    
    public getInputTypeLabel = () => getInputTypeLabel(this.field.inputType, this.utilTranslations);


    ngOnChanges() {
        
        this.updateLabelAndDescription();
    }


    private updateLabelAndDescription() {

        if (!this.field) return;

        const { label, description } = this.labels.getLabelAndDescription(this.field);
        this.label = label;
        this.description = description;
    }
}

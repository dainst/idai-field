import { Component, Input } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Field, Labels } from 'idai-field-core';
import { ConfigurationUtil, InputType } from '../configuration-util';


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
                private i18n: I18n) {}


    public getLabel = (value: any) => this.field.label
        ? this.labels.get(value)
        : this.i18n({ id: 'configuration.newField', value: 'Neues Feld' });

    public getInputTypeLabel = () => ConfigurationUtil.getInputTypeLabel(
        this.field.inputType, this.availableInputTypes
    );
}

import { Component, Input } from '@angular/core';
import { I18N, Labels, Valuelist } from 'idai-field-core';
import { ConfigurationIndex } from '../../index/configuration-index';
import { ValuelistUsage } from '../../index/valuelist-usage-index';


@Component({
    selector: 'valuelist-preview',
    templateUrl: './valuelist-preview.html'
})
/**
 * @author Thomas Kleinke
 */
export class ValuelistPreviewComponent {

    @Input() valuelist: Valuelist|undefined;
    @Input() configurationIndex: ConfigurationIndex;


    constructor(private labels: Labels) {}


    public getLabel = (object: I18N.LabeledValue) => this.labels.get(object);

    public getValuelistDescription = () => this.labels.getDescription(this.valuelist);


    public getUsage(): Array<ValuelistUsage> {

        if (!this.valuelist) return [];

        return ConfigurationIndex.getValuelistUsage(this.configurationIndex, this.valuelist.id) ?? [];
    }
}

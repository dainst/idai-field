import { Component, Input } from '@angular/core';
import { I18N, Labels, Valuelist } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { ValuelistUsage } from '../../../../services/configuration/index/valuelist-usage-index';


@Component({
    selector: 'valuelist-preview',
    templateUrl: './valuelist-preview.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ValuelistPreviewComponent {

    @Input() valuelist: Valuelist|undefined;


    constructor(private labels: Labels,
                private configurationIndex: ConfigurationIndex) {}


    public getLabel = (object: I18N.LabeledValue) => this.labels.get(object);

    public getValuelistDescription = () => this.labels.getDescription(this.valuelist);


    public getUsage(): Array<ValuelistUsage> {

        if (!this.valuelist) return [];

        return this.configurationIndex.getValuelistUsage(this.valuelist.id) ?? [];
    }
}

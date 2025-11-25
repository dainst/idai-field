import { Component, Input } from '@angular/core';
import { Field, Labels, ValuelistValue } from 'idai-field-core';


@Component({
    selector: 'configuration-info',
    templateUrl: './configuration-info.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ConfigurationInfoComponent {

    @Input() configurationItem: ValuelistValue|Field;
    @Input() description: string;


    constructor(private labels: Labels) {}


    public getDescription = () => this.description ?? this.labels.getDescription(this.configurationItem);
}

import { Component, Input } from '@angular/core';
import { Labels, ValuelistValue } from 'idai-field-core';


@Component({
    selector: 'value-info',
    templateUrl: './value-info.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ValueInfoComponent {

    @Input() value: ValuelistValue;


    constructor(private labels: Labels) {}


    public getDescription = (value: ValuelistValue) => this.labels.getDescription(value);
}

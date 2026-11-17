import { Component, Input } from '@angular/core';
import { DateConfiguration } from 'idai-field-core';


@Component({
    selector: 'date-section',
    templateUrl: './date-section.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class DateSectionComponent {

    @Input() dateConfiguration: DateConfiguration;
    @Input() disabled: boolean = false;


    public setDataType(value: DateConfiguration.DataType) {

        this.dateConfiguration.dataType = value;
    }


    public setInputMode(value: DateConfiguration.InputMode) {

        this.dateConfiguration.inputMode = value;
    }
}

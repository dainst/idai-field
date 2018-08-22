import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Resource} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'dai-dropdown-range',
    templateUrl: './dropdown-range.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DropdownRangeComponent implements OnChanges {

    public activateEnd = () => this.endActivated = true;

    private endActivated: boolean = false;

    @Input() resource: Resource;
    @Input() field: any;


    constructor() {}


    ngOnChanges(changes: SimpleChanges): void {

        // TODO this can be removed when the existing data has been adjusted via script
        if (this.field.name === "hasPeriod" &&
            this.resource && this.resource['hasPeriodBeginning']) {

            this.resource['hasPeriod'] = this.resource['hasPeriodBeginning'];
            delete this.resource['hasPeriodBeginning'];
        }
    }


    public showEndElements() {

        return this.endActivated
            || (this.resource[this.field.name + 'End']
                && this.resource[this.field.name + 'End'] !== '');
    }


    public setValue(value: any) {

        if (value === undefined || value === '') {
            this.endActivated = false;
            delete this.resource[this.field.name];
            this.resource[this.field.name + 'End'] = undefined;
        }
    }


    public setEndValue(value: any) {

        if (value === undefined || value === '') {
            this.endActivated = false;
            this.resource[this.field.name + 'End'] = undefined;
        } else {
            this.resource[this.field.name + 'End'] = value;
        }
    }
}
import {Component, Input} from '@angular/core';
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
export class DropdownRangeComponent {

    public activateEnd = () => this.endActivated = true;

    private endActivated: boolean = false;

    @Input() resource: Resource;
    @Input() field: any;


    constructor() {}


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
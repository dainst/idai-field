import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'dai-checkboxes',
    templateUrl: './checkboxes.html'
})

/**
 * @author Fabian Z.
 */
export class CheckboxesComponent {

    @Input() resource: Resource;
    @Input() field: any;

    constructor() {}

    public toggleBox(item: any) {

        if (!this.resource[this.field.name]) this.resource[this.field.name] = [];

        const index = this.resource[this.field.name].indexOf(item, 0);
        if (index !== -1) this.resource[this.field.name].splice(index, 1);
        else this.resource[this.field.name].push(item);

        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }
}
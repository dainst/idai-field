import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';
import {Helper} from './helper';

@Component({
    moduleId: module.id,
    selector: 'dai-checkboxes',
    templateUrl: './checkboxes.html'
})

/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 */
export class CheckboxesComponent {

    @Input() resource: Resource;
    @Input() field: any;


    public notIncludedInValueList() {

        return Helper.notIncludedInValueList(this.resource, this.field.name, this.field.valuelist);
    }


    public removeOutlier(name: string) {

        if (!this.resource || !this.field || !this.field.name || !this.resource[this.field.name]) return;
        this.removeItem(name);
    }


    public toggleBox(item: any) {

        if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
        if (!this.removeItem(item)) this.resource[this.field.name].push(item);
        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }


    private removeItem(name: string): boolean {

        const index = this.resource[this.field.name].indexOf(name, 0);
        if (index !== -1) this.resource[this.field.name].splice(index, 1);
        return index !== -1;
    }
}
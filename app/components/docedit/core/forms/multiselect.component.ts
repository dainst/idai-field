import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from '../document-edit-change-monitor';


@Component({
    moduleId: module.id,
    selector: 'dai-multiselect',
    templateUrl: './multiselect.html'
})

/**
 * @author Fabian Z.
 */
export class MultiselectComponent {

    @Input() resource: Resource;
    @Input() field: any;


    constructor(private documentEditChangeMonitor: DocumentEditChangeMonitor) {}


    public toggleItem(item: any) {

        if (!this.resource[this.field.name]) this.resource[this.field.name] = [];

        const resourceListIndex: number = this.resource[this.field.name].indexOf(item, 0);

        if (resourceListIndex > -1) {
            this.resource[this.field.name].splice(resourceListIndex, 1);
            this.field.valuelist.push(item);
        } else {
            const valueListIndex = this.field.valuelist.indexOf(item, 0);
            this.field.valuelist.splice(valueListIndex, 1);
            this.resource[this.field.name].push(item);
        }

        this.documentEditChangeMonitor.setChanged();
    }
}
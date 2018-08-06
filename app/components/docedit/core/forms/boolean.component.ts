import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from '../document-edit-change-monitor';


@Component({
    moduleId: module.id,
    selector: 'dai-boolean',
    templateUrl: './boolean.html'
})

/**
 * @author Sebastian Cuy
 */
export class BooleanComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;


    constructor(private documentEditChangeMonitor: DocumentEditChangeMonitor) {}


    public setValue(value: any) {

        this.resource[this.fieldName] = value;
        this.documentEditChangeMonitor.setChanged();
    }


    public resetValue() {

        delete this.resource[this.fieldName];
        this.documentEditChangeMonitor.setChanged();
    }
}
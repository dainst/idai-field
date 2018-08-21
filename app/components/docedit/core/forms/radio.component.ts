import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';
import {DocumentEditChangeMonitor} from '../document-edit-change-monitor';


@Component({
    moduleId: module.id,
    selector: 'dai-radio',
    templateUrl: `./radio.html`
})

/**
 * @author Fabian Z.
 */
export class RadioComponent {

    @Input() resource: Resource;
    @Input() field: any;
    

    constructor(private documentEditChangeMonitor: DocumentEditChangeMonitor) {}


    public setValue(value: any) {
        
        this.resource[this.field.name] = value;
        this.documentEditChangeMonitor.setChanged();
    }


    public resetValue() {
        
        delete this.resource[this.field.name];
        this.documentEditChangeMonitor.setChanged();
    }
}
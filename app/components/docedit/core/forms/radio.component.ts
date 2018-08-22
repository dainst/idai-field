import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';


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
    

    public setValue(value: any) {
        
        this.resource[this.field.name] = value;
    }


    public resetValue() {
        
        delete this.resource[this.field.name];
    }
}
import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'dai-inputs',
    templateUrl: './inputs.html'
})

/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class InputsComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;

    
    constructor() {}

    
    public customTrackBy(index: number, obj: any): any {

        return index;
    }
    
    
    public addInputArrayItem() {

        if (this.resource[this.fieldName] == undefined) this.resource[this.fieldName] = new Array<String>();
        this.resource[this.fieldName].push('');
    }
    
    
    public removeInputArrayItemAtIndex(index: any) {

        this.resource[this.fieldName].splice(index, 1);
    }
}
import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from '../document-edit-change-monitor';


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

    
    constructor(private documentEditChangeMonitor: DocumentEditChangeMonitor) {}

    
    public customTrackBy(index: number, obj: any): any {

        return index;
    }
    
    
    public addInputArrayItem() {

        if (this.resource[this.fieldName] == undefined) this.resource[this.fieldName] = new Array<String>();
        this.resource[this.fieldName].push('');
        this.documentEditChangeMonitor.setChanged();
    }
    
    
    public removeInputArrayItemAtIndex(index: any) {

        this.resource[this.fieldName].splice(index, 1);
        this.documentEditChangeMonitor.setChanged();
    }
}
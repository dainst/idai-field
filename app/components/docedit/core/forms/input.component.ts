import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';
import {DocumentEditChangeMonitor} from '../document-edit-change-monitor';


@Component({
    selector: 'dai-input',
    template: `<input [(ngModel)]="resource[fieldName]" (keyup)="markAsChanged()" class="form-control">`
})

/**
 * @author Fabian Zav.
 * @author Sebastian Cuy
 */
export class InputComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;

    
    constructor(private documentEditChangeMonitor: DocumentEditChangeMonitor) {}

    
    public markAsChanged() {
        
        this.documentEditChangeMonitor.setChanged();
    }
}
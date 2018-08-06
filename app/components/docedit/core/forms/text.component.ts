import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from '../document-edit-change-monitor';


@Component({
    selector: 'dai-text',
    template: `<textarea [(ngModel)]="resource[fieldName]" (keyup)="markAsChanged()" class="form-control"></textarea>`
})

/**
 * @author Fabian Z.
 */
export class TextComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;
    

    constructor(private documentEditChangeMonitor: DocumentEditChangeMonitor) {}

    
    public markAsChanged() {
        
        this.documentEditChangeMonitor.setChanged();
    }
}
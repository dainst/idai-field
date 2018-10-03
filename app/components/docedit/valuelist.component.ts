import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';


/**
 * @author Thomas Kleinke
 */
@Component({

    selector: 'valuelist',
    template: `<div>
    <select (change)="setValues($event.target.selectedOptions)" class="form-control" multiple>
        <option *ngFor="let item of field.valuelist" value="{{item}}" [selected]="isSelected(item)">{{item}}</option>
    </select>
</div>`
})

export class ValuelistComponent {

    @Input() document: any;
    @Input() field: any;

    public resource: Resource;


    public ngOnChanges() {

        if (this.document)
            this.resource = this.document['resource'];
    }

    public setValues(selectedOptions: HTMLCollection) {

        this.resource[this.field.relationDefinition] = [];
        for (var i = 0; i < selectedOptions.length; i++) {
            this.resource[this.field.relationDefinition].push(selectedOptions.item(i).childNodes[0].nodeValue);
        }
    }

    public isSelected(item: string) {

        if (this.resource[this.field.relationDefinition])
            return (this.resource[this.field.relationDefinition].indexOf(item) > -1);
        else
            return false;
    }

}
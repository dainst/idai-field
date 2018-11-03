import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';
import {Helper} from './helper';


@Component({
    moduleId: module.id,
    selector: 'dai-dropdown',
    templateUrl: './dropdown.html'
})
/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 */
export class DropdownComponent {

    @Input() resource: Resource;
    @Input() field: any;


    public notIncludedInValueList() {

        return Helper.notIncludedInValueList(this.resource, this.field.name, this.field.valuelist);
    }


    public setValue(value: any) {
        
        if (value === '') this.deleteItem();
    }


    public deleteItem() {

        delete this.resource[this.field.name];
    }
}
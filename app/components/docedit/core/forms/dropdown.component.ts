import {Component, Input, OnChanges} from '@angular/core';
import {Resource} from 'idai-components-2';
import {Helper} from './helper';
import {FieldDefinition} from '../../../../core/configuration/model/field-definition';
import {SettingsService} from '../../../../core/settings/settings-service';


@Component({
    moduleId: module.id,
    selector: 'dai-dropdown',
    templateUrl: './dropdown.html'
})
/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DropdownComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: FieldDefinition;

    public valuelist: string[];


    constructor(private settingsService: SettingsService) {}


    ngOnChanges() {

        this.valuelist = this.getValuelist(this.field);
    }


    public notIncludedInValueList() {

        return Helper.notIncludedInValueList(this.resource, this.field.name, this.valuelist);
    }


    public setValue(value: any) {
        
        if (value === '') this.deleteItem();
    }


    public deleteItem() {

        delete this.resource[this.field.name];
    }


    private getValuelist(field: FieldDefinition): string[] {

        return field.valuelist
            ? field.valuelist
            : this.getValuelistFromProjectField(field.valuelistFromProjectField as string);
    }


    private getValuelistFromProjectField(fieldName: string): string[] {

        const field: string[]|undefined = this.settingsService.getProjectDocument().resource[fieldName];
        return field && Array.isArray(field) ? field : [];
    }
}
import {Component, Input, OnChanges} from '@angular/core';
import {Resource} from 'idai-components-2';
import {SettingsService} from '../../../../core/settings/settings-service';
import {ValuelistUtil} from '../../../../core/util/valuelistUtil';


@Component({
    moduleId: module.id,
    selector: 'dai-radio',
    templateUrl: `./radio.html`
})

/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class RadioComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: any;

    public valuelist: string[];


    constructor(private settingsService: SettingsService) {}


    ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(this.field, this.settingsService.getProjectDocument());
    }


    public getValuesNotIncludedInValuelist() {

        return ValuelistUtil.getValuesNotIncludedInValuelist(this.resource, this.field.name, this.valuelist);
    }
    

    public setValue(value: any) {
        
        this.resource[this.field.name] = value;
    }


    public resetValue() {
        
        delete this.resource[this.field.name];
    }
}
import {Component, Input} from '@angular/core';
import {Resource} from 'idai-components-2';
import {SettingsService} from '../../../../core/settings/settings-service';
import {ValuelistUtil} from '../../../../core/util/valuelist-util';
import {HierarchyUtil} from '../../../../core/util/hierarchy-util';
import {DocumentReadDatastore} from '../../../../core/datastore/document-read-datastore';


@Component({
    moduleId: module.id,
    selector: 'dai-dropdown-range',
    templateUrl: './dropdown-range.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DropdownRangeComponent {

    @Input() resource: Resource;
    @Input() field: any;

    public valuelist: string[];

    private endActivated: boolean = false;


    constructor(private settingsService: SettingsService,
                private datastore: DocumentReadDatastore) {}


    public activateEnd = () => this.endActivated = true;


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            this.settingsService.getProjectDocument(),
            await HierarchyUtil.getParent(this.resource, this.datastore)
        );
    }


    public showEndElements() {

        return this.endActivated
            || (this.resource[this.field.name + 'End']
                && this.resource[this.field.name + 'End'] !== '');
    }


    public setValue(value: any) {

        if (value === undefined || value === '') {
            this.endActivated = false;
            delete this.resource[this.field.name];
            this.resource[this.field.name + 'End'] = undefined;
        }
    }


    public setEndValue(value: any) {

        if (value === undefined || value === '') {
            this.endActivated = false;
            this.resource[this.field.name + 'End'] = undefined;
        } else {
            this.resource[this.field.name + 'End'] = value;
        }
    }
}
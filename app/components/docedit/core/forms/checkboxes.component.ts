import {Component, Input, OnChanges} from '@angular/core';
import {Resource} from 'idai-components-2';
import {SettingsService} from '../../../../core/settings/settings-service';
import {ValuelistUtil} from '../../../../core/util/valuelist-util';
import {DocumentReadDatastore} from '../../../../core/datastore/document-read-datastore';
import {HierarchyUtil} from '../../../../core/util/hierarchy-util';

@Component({
    moduleId: module.id,
    selector: 'dai-checkboxes',
    templateUrl: './checkboxes.html'
})

/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CheckboxesComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: any;

    public valuelist: string[];


    constructor(private settingsService: SettingsService,
                private datastore: DocumentReadDatastore) {}


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            this.settingsService.getProjectDocument(),
            await HierarchyUtil.getParent(this.resource, this.datastore)
        );
    }


    public toggleCheckbox(item: string) {

        if (!this.resource[this.field.name]) this.resource[this.field.name] = [];
        if (!this.removeItem(item)) this.resource[this.field.name].push(item);
        if (this.resource[this.field.name].length === 0) delete this.resource[this.field.name];
    }


    private removeItem(name: string): boolean {

        const index = this.resource[this.field.name].indexOf(name, 0);
        if (index !== -1) this.resource[this.field.name].splice(index, 1);
        return index !== -1;
    }
}
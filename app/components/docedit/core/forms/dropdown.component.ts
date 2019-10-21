import {Component, Input, OnChanges} from '@angular/core';
import {Resource} from 'idai-components-2';
import {FieldDefinition} from '../../../../core/configuration/model/field-definition';
import {SettingsService} from '../../../../core/settings/settings-service';
import {ValuelistUtil} from '../../../../core/util/valuelist-util';
import {HierarchyUtil} from '../../../../core/util/hierarchy-util';
import {DocumentReadDatastore} from '../../../../core/datastore/document-read-datastore';


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


    constructor(private settingsService: SettingsService,
                private datastore: DocumentReadDatastore) {}


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            this.settingsService.getProjectDocument(),
            await HierarchyUtil.getParent(this.resource, this.datastore)
        );
    }


    public deleteIfEmpty(value: string) {
        
        if (value === '') delete this.resource[this.field.name];
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && this.valuelist.length === 0
    }
}
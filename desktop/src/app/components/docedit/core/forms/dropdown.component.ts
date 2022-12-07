import { Component, Input, OnChanges } from '@angular/core';
import { Datastore, Labels, Field, Resource, Valuelist, ValuelistUtil, Hierarchy } from 'idai-field-core';


@Component({
    selector: 'form-field-dropdown',
    templateUrl: './dropdown.html'
})
/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DropdownComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: Field;

    public valuelist: Valuelist;


    constructor(private datastore: Datastore,
                private labels: Labels) {}


    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            await Hierarchy.getParentResource(id => this.datastore.get(id), this.resource)
        );
    }


    public deleteIfEmpty(value: string) {

        if (value === '') delete this.resource[this.field.name];
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0;
    }
}

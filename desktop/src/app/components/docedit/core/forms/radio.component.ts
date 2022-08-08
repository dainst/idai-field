import { Component, Input, OnChanges } from '@angular/core';
import { Datastore, Resource, Valuelist, ValuelistUtil, Labels, Hierarchy } from 'idai-field-core';


@Component({
    selector: 'form-field-radio',
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

    public valuelist: Valuelist;


    constructor(private datastore: Datastore,
                private labels: Labels) {}


    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            await Hierarchy.getParent(id => this.datastore.get(id), this.resource)
        );
    }


    public setValue(value: any) {

        this.resource[this.field.name] = value;
    }


    public resetValue() {

        delete this.resource[this.field.name];
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0
    }
}

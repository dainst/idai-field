import { Component, Input, OnChanges } from '@angular/core';
import { Datastore, Resource, Valuelist, ValuelistUtil, Labels, Hierarchy,
    ProjectConfiguration } from 'idai-field-core';


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
    @Input() fieldContainer: any;
    @Input() field: any;

    public valuelist: Valuelist;


    constructor(private datastore: Datastore,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration) {}


    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            this.projectConfiguration,
            await Hierarchy.getParentResource(id => this.datastore.get(id), this.resource),
            this.fieldContainer[this.field.name]
        );
    }


    public setValue(value: any) {

        this.fieldContainer[this.field.name] = value;
    }


    public resetValue() {

        delete this.fieldContainer[this.field.name];
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0
    }
}

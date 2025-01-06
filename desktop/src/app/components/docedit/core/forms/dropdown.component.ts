import { Component, Input, OnChanges } from '@angular/core';
import { Datastore, Labels, Field, Valuelist, ValuelistUtil, Hierarchy, Resource,
    ProjectConfiguration } from 'idai-field-core';


@Component({
    selector: 'form-field-dropdown',
    templateUrl: './dropdown.html',
    standalone: false
})
/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DropdownComponent implements OnChanges {

    @Input() resource: Resource
    @Input() fieldContainer: any;
    @Input() field: Field;

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


    public updateValue(newValue: string) {

        if (newValue === '' || newValue === null) {
            delete this.fieldContainer[this.field.name];
        } else {
            this.fieldContainer[this.field.name] = newValue;
        }
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0;
    }
}

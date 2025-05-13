import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Datastore, Valuelist, ValuelistUtil, Labels, Hierarchy, Resource, Field,
    ProjectConfiguration } from 'idai-field-core';

@Component({
    selector: 'form-field-checkboxes',
    templateUrl: './checkboxes.html',
    standalone: false
})

/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CheckboxesComponent implements OnChanges {

    @Input() resource: Resource
    @Input() fieldContainer: any;
    @Input() field: Field;

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public valuelist: Valuelist;


    constructor(private datastore: Datastore,
                private labels: Labels,
                private projectConfiguration: ProjectConfiguration) {}


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            this.projectConfiguration,
            await Hierarchy.getParentResource(id => this.datastore.get(id), this.resource),
            this.fieldContainer[this.field.name]
        );
    }


    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);


    public toggleCheckbox(item: string) {

        if (!this.fieldContainer[this.field.name]) this.fieldContainer[this.field.name] = [];
        if (!this.removeItem(item)) this.fieldContainer[this.field.name].push(item);
        if (this.fieldContainer[this.field.name].length === 0) delete this.fieldContainer[this.field.name];

        this.onChanged.emit();
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0
    }


    private removeItem(name: string): boolean {

        const index = this.fieldContainer[this.field.name].indexOf(name, 0);
        if (index !== -1) this.fieldContainer[this.field.name].splice(index, 1);
        return index !== -1;
    }
}

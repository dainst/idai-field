import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Datastore, Labels, Field, Valuelist, ValuelistUtil, Resource } from 'idai-field-core';


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

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public valuelist: Valuelist;
    public values: string[];


    constructor(private datastore: Datastore,
                private labels: Labels) {}


    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            this.fieldContainer[this.field.name]
        );

        this.values = this.getValues();
    }


    public updateValue(newValue: string) {

        if (newValue === '' || newValue === null) {
            delete this.fieldContainer[this.field.name];
        } else {
            this.fieldContainer[this.field.name] = newValue;
        }
        
        this.onChanged.emit();
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0;
    }


    private getValues() {

        return this.valuelist
            ? this.labels.orderKeysByLabels(this.valuelist)
            : [];
    }
}

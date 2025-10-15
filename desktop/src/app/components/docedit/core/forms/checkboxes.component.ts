import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { Datastore, Valuelist, ValuelistUtil, Labels, Resource, Field, ValuelistValue } from 'idai-field-core';
import { ConfigurationInfoProvider } from '../../../widgets/configuration-info-provider';


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
export class CheckboxesComponent extends ConfigurationInfoProvider implements OnChanges, OnDestroy {

    @Input() resource: Resource
    @Input() fieldContainer: any;
    @Input() field: Field;

    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public valuelist: Valuelist;


    constructor(private datastore: Datastore,
                private labels: Labels) {
            
        super();
    }


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get('project'),
            this.fieldContainer[this.field.name]
        );
    }


    ngOnDestroy() {

        this.removeListeners();
    }


    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);


    public hasInfo(valueId: string): boolean {
        
        const value: ValuelistValue = this.valuelist?.values[valueId];
        return value && !!(this.labels.getDescription(value) || value.references?.length);
    }


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

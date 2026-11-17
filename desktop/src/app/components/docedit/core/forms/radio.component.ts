import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { Datastore, Resource, Valuelist, ValuelistUtil, Labels, ValuelistValue } from 'idai-field-core';
import { ConfigurationInfoProvider } from '../../../widgets/configuration-info-provider';


@Component({
    selector: 'form-field-radio',
    templateUrl: './radio.html',
    standalone: false
})

/**
 * @author Fabian Z.
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class RadioComponent extends ConfigurationInfoProvider implements OnChanges, OnDestroy {

    @Input() resource: Resource;
    @Input() fieldContainer: any;
    @Input() field: any;
    
    @Output() onChanged: EventEmitter<void> = new EventEmitter<void>();

    public valuelist: Valuelist;


    constructor(private datastore: Datastore,
                private labels: Labels) {

        super();
    }


    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getLabel = (valueId: string) => this.labels.getValueLabel(this.valuelist, valueId);


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


    public hasInfo(valueId: string): boolean {
        
        const value: ValuelistValue = this.valuelist?.values[valueId];
        return value && !!(this.labels.getDescription(value) || value.references?.length);
    }


    public setValue(value: any) {

        this.fieldContainer[this.field.name] = value;
        this.onChanged.emit();
    }


    public resetValue() {

        delete this.fieldContainer[this.field.name];
        this.onChanged.emit();
    }


    public hasEmptyValuelist(): boolean {

        return this.valuelist && Object.keys(this.valuelist.values).length === 0
    }
}

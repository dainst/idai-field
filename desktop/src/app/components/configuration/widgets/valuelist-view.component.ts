import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { clone, Map } from 'tsfun';
import { Labels, Valuelist, ValuelistValue } from 'idai-field-core';
import { ConfigurationInfoProvider } from '../../widgets/configuration-info-provider';


@Component({
    selector: 'valuelist-view',
    templateUrl: './valuelist-view.html',
    standalone: false
})
/**
 *  @author Sebastian Cuy
 *  @author Thomas Kleinke
 */
export class ValuelistViewComponent extends ConfigurationInfoProvider implements OnChanges, OnDestroy {

    @Input() valuelist: Valuelist;
    @Input() showDescription: boolean = true;
    @Input() largeList: boolean;

    public valueLabels: Map<string> = {};
    public valueDescriptions: Map<string> = {};


    constructor(private labels: Labels) {

        super();
    }


    ngOnChanges() {
        
        Object.keys(this.valuelist.values).forEach(valueId => {
            const { label, description } = this.getLabelAndDescription(valueId);
            this.valueLabels[valueId] = label;
            this.valueDescriptions[valueId] = description;
        });
    }


    ngOnDestroy() {
        
        this.removeListeners();
    }
    

    public getValuelistDescription = (valuelist: Valuelist) => this.labels.getDescription(valuelist);

    public getValueIds = (valuelist: Valuelist) => this.labels.orderKeysByLabels(valuelist);


    public hasInfo(valueId: string): boolean {

        const value: ValuelistValue = this.valuelist.values[valueId];

        return this.valueDescriptions[valueId] !== undefined || (value.references && value.references?.length > 0);
    }


    private getLabelAndDescription(valueId: string): { label: string, description?: string } {

        const value: any = clone(this.valuelist.values[valueId]);
        value.name = valueId;

        return this.labels.getLabelAndDescription(value);
    }
}

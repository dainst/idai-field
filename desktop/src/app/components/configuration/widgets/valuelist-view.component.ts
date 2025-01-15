import { Component, Input, OnChanges } from '@angular/core';
import { clone, Map } from 'tsfun';
import { Labels, Valuelist } from 'idai-field-core';


@Component({
    selector: 'valuelist-view',
    templateUrl: './valuelist-view.html',
    standalone: false
})
/**
 *  @author Sebastian Cuy
 *  @author Thomas Kleinke
 */
export class ValuelistViewComponent implements OnChanges {

    @Input() valuelist: Valuelist;
    @Input() showDescription: boolean = true;
    @Input() largeList: boolean;

    public valueLabels: Map<string> = {};
    public valueDescriptions: Map<string> = {};


    constructor(private labels: Labels) {}


    ngOnChanges() {
        
        Object.keys(this.valuelist.values).forEach(valueId => {
            const { label, description } = this.getLabelAndDescription(valueId);
            this.valueLabels[valueId] = label;
            this.valueDescriptions[valueId] = description;
        });
    }
    

    public getValuelistDescription = (valuelist: Valuelist) => this.labels.getDescription(valuelist);

    public getValues = (valuelist: Valuelist) => this.labels.orderKeysByLabels(valuelist);


    private getLabelAndDescription(valueId: string): { label: string, description?: string } {

        const value: any = clone(this.valuelist.values[valueId]);
        value.name = valueId;

        return this.labels.getLabelAndDescription(value);
    }
}

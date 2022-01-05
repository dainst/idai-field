import { Component, Input } from '@angular/core';
import { Labels, Valuelist } from 'idai-field-core';


const locale: string = typeof window !== 'undefined'
    ? window.require('@electron/remote').getGlobal('config').locale
    : 'de';


@Component({
    selector: 'valuelist-view',
    templateUrl: './valuelist-view.html'
})
/**
 *  @author Sebastian Cuy
 *  @author Thomas Kleinke
 */
export class ValuelistViewComponent {

    @Input() valuelist: Valuelist;
    @Input() showDescription: boolean;
    @Input() largeList: boolean;


    constructor(private labels: Labels) {}
    

    public getValuelistDescription = (valuelist: Valuelist) => valuelist.description?.[locale];

    public getValues = (valuelist: Valuelist) => this.labels.orderKeysByLabels(valuelist);

    public getValueLabel = (valuelist: Valuelist, valueId: string) =>
        this.labels.getValueLabel(valuelist, valueId);
}

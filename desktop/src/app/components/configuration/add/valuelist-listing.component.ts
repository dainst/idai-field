import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Labels, Valuelist } from 'idai-field-core';


@Component({
    selector: 'valuelist-listing',
    templateUrl: './valuelist-listing.html'
})
/**
 * @author Thomas Kleinke
 */
export class ValuelistListingComponent {

    @Input() valuelists: Array<Valuelist> = [];
    @Input() selectedValuelist: Valuelist;
    @Input() searchTerm: string = '';

    @Output() onValuelistSelected = new EventEmitter<Valuelist>();


    constructor(private labels: Labels) {}


    public select = (valuelist: Valuelist) => this.onValuelistSelected.emit(valuelist);

    public getLabel = (value: any) => this.labels.get(value);


    public getSearchResultLabel(valuelist: Valuelist): string|undefined {

        if (this.searchTerm === ''
                || valuelist.id.toLocaleLowerCase().startsWith(this.searchTerm.toLocaleLowerCase())) {
            return undefined;
        }

        for (let valueId of Object.keys(valuelist.values)) {
            if (valueId.toLocaleLowerCase().startsWith(this.searchTerm.toLocaleLowerCase())) {
                return valueId;
            } else if (valuelist.values[valueId].label) {
                const label: string|undefined = Object.values(valuelist.values[valueId].label).find(translation => {
                    return translation.toLocaleLowerCase().startsWith(this.searchTerm.toLocaleLowerCase());
                });
                if (label) return label;
            }
        }

        return undefined;
    }
}

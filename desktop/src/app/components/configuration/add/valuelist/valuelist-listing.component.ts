import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Labels, Valuelist } from 'idai-field-core';
import { containsSearchTerm } from '../getSearchResultLabel';


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
    @Input() emptyValuelist: Valuelist|undefined;
    @Input() searchTerm: string = '';
    @Input() currentValuelistId: string|undefined;

    @Output() onValuelistSelected = new EventEmitter<Valuelist>();
    @Output() onCreateValuelist = new EventEmitter<void>();


    constructor(private labels: Labels) {}


    public select = (valuelist: Valuelist) => this.onValuelistSelected.emit(valuelist);

    public createNewValuelist = () => this.onCreateValuelist.emit();

    public getLabel = (value: any) => this.labels.get(value);

    public isNewValuelistOptionShown = (): boolean => this.emptyValuelist !== undefined
        && !this.valuelists.map(valuelist => valuelist.id).includes(this.searchTerm)
        && (!this.currentValuelistId || this.searchTerm !== this.currentValuelistId);


    public getSearchResultLabel(valuelist: Valuelist): string|undefined {

        if (this.searchTerm === '' || containsSearchTerm(valuelist.id, this.searchTerm)) {
            return undefined;
        }
    
        for (let valueId of Object.keys(valuelist.values)) {
            if (containsSearchTerm(valueId, this.searchTerm)) {
                return valueId;
            } else if (valuelist.values[valueId].label) {
                const label: string|undefined = Object.values(valuelist.values[valueId].label).find(translation => {
                    return containsSearchTerm(translation, this.searchTerm);
                });
                if (label) return label;
            }
        }
    
        return undefined;
    }
}

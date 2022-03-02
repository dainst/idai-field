import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Labels, Valuelist } from 'idai-field-core';
import { ConfigurationContextMenu } from '../../context-menu/configuration-context-menu';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
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
    @Input() filteredValuelists: Array<Valuelist> = [];
    @Input() selectedValuelist: Valuelist;
    @Input() emptyValuelist: Valuelist|undefined;
    @Input() searchTerm: string = '';
    @Input() currentValuelistId: string|undefined;
    @Input() contextMenu: ConfigurationContextMenu;

    @Output() onValuelistSelected = new EventEmitter<Valuelist>();
    @Output() onOpenEditor = new EventEmitter<Valuelist>();


    constructor(private labels: Labels,
               private configurationIndex: ConfigurationIndex) {}


    public select = (valuelist: Valuelist) => this.onValuelistSelected.emit(valuelist);

    public openEditor = (valuelist: Valuelist) => this.onOpenEditor.emit(valuelist);

    public getValuelistId = (valuelist: Valuelist) => 'valuelist-' + valuelist.id.replace(':', '-');

    public getLabel = (value: any) => this.labels.get(value);

    public isCustomValuelist = (valuelist: Valuelist) => valuelist.source === 'custom';

    public isNewValuelistOptionShown = (): boolean => this.emptyValuelist !== undefined
        && !this.valuelists.map(valuelist => valuelist.id).includes(this.emptyValuelist.id)
        && (!this.currentValuelistId || this.emptyValuelist.id !== this.currentValuelistId);


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


    public isInUse(valuelist: Valuelist): boolean {
     
        return this.configurationIndex.getValuelistUsage(valuelist.id).length > 0;
    }
}

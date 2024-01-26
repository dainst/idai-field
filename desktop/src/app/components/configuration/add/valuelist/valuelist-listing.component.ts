import { Component, Input, Output, EventEmitter, ViewChild, OnChanges } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { all } from 'tsfun';
import { Labels, Valuelist } from 'idai-field-core';
import { ConfigurationContextMenu } from '../../context-menu/configuration-context-menu';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { containsSearchTerm } from '../getSearchResultLabel';
import { tokenize } from '../../../../services/configuration/index/tokenize';
import { scrollTo } from '../../../../angular/scrolling';


@Component({
    selector: 'valuelist-listing',
    templateUrl: './valuelist-listing.html'
})
/**
 * @author Thomas Kleinke
 */
export class ValuelistListingComponent implements OnChanges {

    @Input() valuelists: Array<Valuelist> = [];
    @Input() filteredValuelists: Array<Valuelist> = [];
    @Input() selectedValuelist: Valuelist;
    @Input() emptyValuelist: Valuelist|undefined;
    @Input() searchTerm: string = '';
    @Input() currentValuelistId: string|undefined;
    @Input() contextMenu: ConfigurationContextMenu;

    @Output() onValuelistSelected = new EventEmitter<Valuelist>();
    @Output() onOpenEditor = new EventEmitter<Valuelist>();

    @ViewChild(CdkVirtualScrollViewport) scrollViewport: CdkVirtualScrollViewport;


    constructor(private labels: Labels,
                private configurationIndex: ConfigurationIndex) {}


    public select = (valuelist: Valuelist) => this.onValuelistSelected.emit(valuelist);

    public openEditor = (valuelist: Valuelist) => this.onOpenEditor.emit(valuelist);

    public getValuelistId = (valuelist: Valuelist) => 'valuelist-' + valuelist.id.replace(':', '-');

    public getLabel = (value: any) => this.labels.get(value);

    public isCustomValuelist = (valuelist: Valuelist) => valuelist.source === 'custom';

    public trackValuelist = (_: number, item: Valuelist) => item.id;

    public isNewValuelistOptionShown = (): boolean => this.emptyValuelist !== undefined
        && !this.valuelists.map(valuelist => valuelist.id).includes(this.emptyValuelist.id)
        && (!this.currentValuelistId || this.emptyValuelist.id !== this.currentValuelistId);


    ngOnChanges() {
        
        if (this.selectedValuelist) this.scrollTo(this.selectedValuelist.id);
    }


    public getSearchResultLabel(valuelist: Valuelist): string|undefined {

        const searchTokens: string[] = tokenize([this.searchTerm], false);

        if (this.searchTerm === ''
            || all((searchToken: string) => containsSearchTerm(valuelist.id, searchToken, false))(searchTokens)) {
            return undefined;
        }
    
        for (let searchToken of searchTokens) {
            for (let valueId of Object.keys(valuelist.values)) {
                if (containsSearchTerm(valueId, searchToken)) {
                    return valueId;
                } else if (valuelist.values[valueId].label) {
                    const label: string|undefined = Object.values(valuelist.values[valueId].label).find(translation => {
                        return containsSearchTerm(translation, searchToken);
                    });
                    if (label) return label;
                }
            }
        }
    
        return undefined;
    }


    public isInUse(valuelist: Valuelist): boolean {
     
        return this.configurationIndex.getValuelistUsage(valuelist.id).length > 0;
    }


    private scrollTo(valuelistId: string) {

        if (!this.scrollViewport) return;

        const index = this.filteredValuelists.findIndex(valuelist => valuelist.id === valuelistId);
        scrollTo(index, 'valuelist-' + valuelistId.replace(':', '-'), this.scrollViewport);
    }
}

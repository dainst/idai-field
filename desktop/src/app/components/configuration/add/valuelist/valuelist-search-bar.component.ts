import { Component, EventEmitter, Output } from '@angular/core';
import { ValuelistSearchQuery } from './valuelist-search-query';


@Component({
    selector: 'valuelist-search-bar',
    templateUrl: './valuelist-search-bar.html'
})
/**
 * @author Thomas Kleinke
 */
export class ValuelistSearchBarComponent {

    @Output() onQueryChanged: EventEmitter<ValuelistSearchQuery> = new EventEmitter<ValuelistSearchQuery>();

    public queryString: string = '';
    public onlyCustom: boolean = false;
    public onlyInUse: boolean = false;


    public toggleCustomFilter() {

        this.onlyCustom = !this.onlyCustom;
        this.submitQuery();
    }


    public toggleInUseFilter() {

        this.onlyInUse = !this.onlyInUse;
        this.submitQuery();
    }


    public submitQuery() {

        this.onQueryChanged.emit({
            queryString: this.queryString,
            onlyCustom: this.onlyCustom,
            onlyInUse: this.onlyInUse
        });
    }
}

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

    public queryString: string;


    constructor() {}


    public submitQuery() {

        this.onQueryChanged.emit({
            queryString: this.queryString
        });
    }
}

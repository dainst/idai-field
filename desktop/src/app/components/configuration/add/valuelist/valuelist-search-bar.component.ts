import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { ComponentHelpers } from '../../../component-helpers';
import { ValuelistSearchQuery } from './valuelist-search-query';


@Component({
    selector: 'valuelist-search-bar',
    templateUrl: './valuelist-search-bar.html',
    host: {
        '(document:click)': 'handleClick($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ValuelistSearchBarComponent {

    @Input() searchQuery: ValuelistSearchQuery;
    @Output() onQueryChanged: EventEmitter<void> = new EventEmitter<void>();

    @ViewChild('popover', { static: false }) private popover: NgbPopover;


    public toggleCustomFilter() {

        this.searchQuery.onlyCustom = !this.searchQuery.onlyCustom;
        this.submitQuery();
    }


    public toggleInUseFilter() {

        this.searchQuery.onlyInUse = !this.searchQuery.onlyInUse;
        this.submitQuery();
    }


    public submitQuery() {

        this.onQueryChanged.emit();
    }


    public handleClick(event: any) {

        if (!this.popover) return;

        if (!ComponentHelpers.isInside(event.target, target => target.id
                && target.id.includes('valuelist-filter-button'))) {
            this.popover.close();
        }
    }
}

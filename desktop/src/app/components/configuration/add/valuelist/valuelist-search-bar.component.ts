import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { ComponentHelpers } from '../../../component-helpers';
import { ValuelistSearchQuery } from './valuelist-search-query';


@Component({
    selector: 'valuelist-search-bar',
    templateUrl: './valuelist-search-bar.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class ValuelistSearchBarComponent {

    @Output() onQueryChanged: EventEmitter<ValuelistSearchQuery> = new EventEmitter<ValuelistSearchQuery>();

    @ViewChild('popover', { static: false }) private popover: NgbPopover;

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


    public handleClick(event: any) {

        if (!this.popover) return;

        if (!ComponentHelpers.isInside(event.target, target => target.id
                && target.id.includes('valuelist-filter-button'))) {

            this.popover.close();
        }
    }
}

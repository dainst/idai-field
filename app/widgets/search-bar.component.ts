import {Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {ProjectConfiguration} from 'idai-components-2';
import {IdaiType} from 'idai-components-2';


@Component({
    moduleId: module.id,
    selector: 'search-bar',
    templateUrl: './search-bar.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})

/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Jan G. Wieners
 */
export class SearchBarComponent implements OnChanges {

    // If these values are set, only valid domain types for the given relation name & range type are shown in the
    // filter menu.
    @Input() relationName: string;
    @Input() relationRangeType: string;

    // If this value is set, only child types of the parent type are shown in the filter menu.
    // The 'all types' option is not visible if a parent type is set because choosing the parent type is equivalent to
    // this option.
    @Input() parentType: string;

    @Input() q: string = '';
    @Input() types: string[]|undefined;
    @Input() showFiltersMenu: boolean = true;

    @Output() onTypesChanged = new EventEmitter<string[]>();
    @Output() onQueryStringChanged = new EventEmitter<string>();

    @ViewChild('p') protected popover: any;

    protected filterOptions: Array<IdaiType> = [];


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public ngOnChanges(changes: SimpleChanges) {

        if (changes['relationName'] || changes['relationRangeType'] || changes['parentType'] ||
            changes['showFiltersMenu']) {
            this.initializeFilterOptions();
        }
    }


    public chooseTypeFilter(type: IdaiType) {

        if (!type) {
            this.types = undefined;
        } else {
            this.types = [type.name];

            if (type.children) {
                for (let childType of type.children) {
                    this.types.push(childType.name);
                }
            }
        }

        this.onTypesChanged.emit(this.types);
    }


    public onKeyUp(event?: KeyboardEvent) {

        this.onQueryStringChanged.emit(this.q);
    }


    protected initializeFilterOptions() {

        this.filterOptions = [];
        this.addFilterOptionsFromConfiguration();
    }


    protected addFilterOptionsFromConfiguration() {

        for (let type of this.projectConfiguration.getTypesTreeList()) {

            if (this.parentType && type.name !== this.parentType) continue;

            if ((!this.relationName && !this.relationRangeType)
                    || this.projectConfiguration.isAllowedRelationDomainType(type.name, this.relationRangeType,
                    this.relationName)) {

                this.addFilterOption(type);

            } else if (type.children) {

                this.addFilterOptionsFor(type);
            }

        }
    }


    protected addFilterOptionsFor(type: IdaiType) {

        for (let childType of type.children) {
            if (this.projectConfiguration.isAllowedRelationDomainType(childType.name, this.relationRangeType,
                    this.relationName)) {
                this.addFilterOption(childType);
            }
        }
    }


    protected addFilterOption(type: IdaiType) {

        if (this.filterOptions.indexOf(type) == -1) {
            this.filterOptions.push(type);
        }
    }


    protected handleClick(event: any) {

        if (!this.popover) return;

        let target = event.target;
        let inside: boolean = false;

        do {
            if (target.id === 'filter-button') {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.popover.close();
    }
}
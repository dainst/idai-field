import {Component, EventEmitter, Input, Output, OnChanges} from "@angular/core";
import {Query, FilterSet} from "idai-components-2/datastore";
import {ConfigLoader, ProjectConfiguration} from "idai-components-2/configuration";

@Component({
    moduleId: module.id,
    selector: 'search-bar',
    templateUrl: './search-bar.html'
})

/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class SearchBarComponent implements OnChanges {

    private type: string = '';
    private q: string = '';
    private filterOptions: Array<any> = [];
    private projectConfiguration: ProjectConfiguration;

    @Input() defaultFilterSet: FilterSet;
    @Input() showFiltersMenu: boolean;
    @Output() onQueryChanged = new EventEmitter<Query>();

    constructor(private configLoader: ConfigLoader) {
        this.configLoader.configuration().subscribe(result => {
            this.projectConfiguration = result.projectConfiguration;
            this.initializeFilterOptions();
        });
    }

    public ngOnChanges(): void {

        this.initializeFilterOptions();
    }
    
    public qChanged(q): void {

        if (q) this.q = q;
        else this.q = '';
        this.emitCurrentQuery();
    }

    public setType(type): void {

        this.type = type;
        this.emitCurrentQuery();
    }

    private emitCurrentQuery() {

        let query: Query = { q: this.q };

        let filterSets: Array<FilterSet> = [];
        if (this.defaultFilterSet) filterSets.push(this.defaultFilterSet);

        if (this.type) filterSets.push({
            filters: [{field: 'type', value: this.type, invert: false}],
            type: 'and'
        });

        query.filterSets = filterSets;

        this.onQueryChanged.emit(query);
    }

    private initializeFilterOptions() {

        if (!this.projectConfiguration) return;

        var types = this.projectConfiguration.getTypesTreeList();
        this.filterOptions = [];

        for (let i in types) {
            this.addFilterOption(types[i]);
        }
    }

    private addFilterOption(type) {

        var defaultFilterConflict = false;
        var defaultFilters = this.defaultFilterSet ? this.defaultFilterSet.filters : [];

        for (let i in defaultFilters) {
            if (defaultFilters[i].field == "type"
                && defaultFilters[i].value == type.name) {
                defaultFilterConflict = true;
                break;
            }
        }

        if (!defaultFilterConflict) {
            this.filterOptions.push(type);
            if (type.children) {
                for (let i in type.children) {
                    this.addFilterOption(type.children[i]);
                }
            }
        }
    }
    
}
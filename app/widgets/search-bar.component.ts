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

    @Input() defaultFilterSet: FilterSet;
    @Input() showFiltersMenu: boolean;
    @Output() onQueryChanged = new EventEmitter<Query>();

    constructor(private configLoader: ConfigLoader) {
        this.initializeFilterOptions();
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
            filters: [this.type]
        });

        query.filterSets = filterSets;

        this.onQueryChanged.emit(query);
    }

    private initializeFilterOptions() {

        this.configLoader.getProjectConfiguration().then(projectConfiguration => {
            
            let types = projectConfiguration.getTypesMap();
            this.filterOptions = [];
    
            for (let i in types) {
                this.addFilterOption(types[i]);
            }
        })
    }

    private addFilterOption(type) {

        let defaultFilters = this.defaultFilterSet ? this.defaultFilterSet.filters : [];

        for (let i in defaultFilters) {
            if (defaultFilters[i] == type.name) {

                if (this.filterOptions.indexOf(type) == -1) {
                    this.filterOptions.push(type);
                }
            }
        }
    }
    
}
import {Component, EventEmitter, Input, Output} from "@angular/core";
import {ConfigLoader, Query, Filter} from "idai-components-2/idai-components-2";

@Component({
    moduleId: module.id,
    selector: 'search-bar',
    templateUrl: './search-bar.html'
})

/**
 * @author Sebastian Cuy
 */
export class SearchBarComponent {

    private projectConfiguration;
    private type: string = '';
    private q: string = '';

    @Input() defaultFilters: Array<Filter>;
    @Input() showFiltersMenu: boolean;
    @Output() onQueryChanged = new EventEmitter<Query>();

    constructor(private configLoader: ConfigLoader) {
        this.configLoader.configuration().subscribe(result => {
            this.projectConfiguration = result.projectConfiguration;
        });
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

        let filters: Array<Filter> = this.defaultFilters.slice();
        if (this.type) filters.push({ field: 'type', value: this.type, invert: false });
        query.filters = filters;

        this.onQueryChanged.emit(query);
    }
    
}
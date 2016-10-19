import {Component, EventEmitter, Output} from "@angular/core";
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
    private typeFilter: Filter = { field: 'type', value: '', invert: false };
    private query: Query = { q: '', filters: [this.typeFilter] };

    @Output() onQueryChanged = new EventEmitter<Query>();

    constructor(private configLoader: ConfigLoader) {
        this.configLoader.configuration().subscribe(result => {
            this.projectConfiguration = result.projectConfiguration;
        });
    }
    
    public queryStringChanged(event) {
        if (event.target.value) this.query.q = event.target.value;
        else this.query.q = '';
        this.onQueryChanged.emit(this.query);
    }

    public setTypeFilter(type) {
        this.typeFilter['value'] = type;
        this.onQueryChanged.emit(this.query);
    }
    
}
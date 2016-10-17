import {Component, EventEmitter, Output} from "@angular/core";
import {ConfigLoader, Query} from "idai-components-2/idai-components-2";

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
    private query: Query = { q: '', filters: { type: '' } };

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
        this.query.filters['type'] = type;
        this.onQueryChanged.emit(this.query);
    }
    
}
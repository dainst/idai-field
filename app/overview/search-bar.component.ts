import {Component, EventEmitter, Output} from "@angular/core";
import {Query} from '../model/query';

@Component({
    moduleId: module.id,
    selector: 'search-bar',
    templateUrl: './search-bar.html'
})

/**
 * @author Sebastian Cuy
 */
export class SearchBarComponent {

    private query: Query = { q: '' };

    @Output() queryChanged = new EventEmitter<Query>();
    
    public queryStringChanged(event) {
        if (event.target.value) this.query.q = event.target.value;
        else this.query.q = '';
        this.queryChanged.emit(this.query);
    }
    
}
import {Component, EventEmitter, Input, Output, OnChanges, ViewChild} from "@angular/core";
import {Query} from "idai-components-2/datastore";
import {ConfigLoader, ProjectConfiguration} from "idai-components-2/configuration";

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
 */
export class SearchBarComponent implements OnChanges {

    private type: string = 'resource';
    private q: string = '';
    private filterOptions: Array<any> = [];

    @Input() defaultFilterSet: Array<string>;
    @Input() showFiltersMenu: boolean;
    @Output() onQueryChanged = new EventEmitter<Query>();
    @ViewChild('p') private popover;

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

        let query: Query = { q: this.q, type: this.type, prefix: true };
        this.onQueryChanged.emit(query);
    }

    private initializeFilterOptions() {

        this.configLoader.getProjectConfiguration().then(projectConfiguration => {

            let types = projectConfiguration.getTypesMap();
            this.filterOptions = [];
    
            for (let i in types) {
                let pTypes = projectConfiguration.getParentTypes(types[i].name);

                if (pTypes.indexOf('image') == -1)
                    this.addFilterOption(types[i]);
            }
        })
    }

    private addFilterOption(type) {

        if (this.filterOptions.indexOf(type) == -1) {
            this.filterOptions.push(type);
        }
    }

    private handleClick(event) {
        if (!this.popover) return;
        var target = event.target;
        var inside = false;
        do {
            if (target.id === 'filter-button') {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);
        if (!inside) {
            this.popover.close();
        }
    }
    
}
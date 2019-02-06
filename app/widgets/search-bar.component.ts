import {Component, EventEmitter, Input, Output, ViewChild, ElementRef} from '@angular/core';
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
export class SearchBarComponent {

    @Input() filterOptions: Array<IdaiType> = [];
    @Input() showFiltersMenu: boolean = true;

    @Input() q: string = '';
    @Input() types: string[]|undefined;

    @Output() onTypesChanged = new EventEmitter<string[]>();
    @Output() onQueryStringChanged = new EventEmitter<string>();

    @ViewChild('p') protected popover: any;
    @ViewChild('searchInput') fulltextSearchInput: ElementRef;

    public focused: boolean = false;

    private emitQueryTimeout: any = undefined;


    public isAllTypesOptionVisible = () => this.filterOptions && this.filterOptions.length > 1;


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


    public onKeyUp(event: KeyboardEvent) {

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key)) {
            return;
        }

        if (this.emitQueryTimeout) clearTimeout(this.emitQueryTimeout);

        this.emitQueryTimeout = setTimeout(() => {
            this.emitQueryTimeout = undefined;
            this.onQueryStringChanged.emit(this.q);
        }, 200);
    }


    public blur() {

        this.fulltextSearchInput.nativeElement.blur();
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
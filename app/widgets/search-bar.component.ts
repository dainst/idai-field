import {Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnChanges,
    SimpleChanges} from '@angular/core';
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


    ngOnChanges(changes: SimpleChanges) {

        if (changes['filterOptions'] && this.filterOptions.length === 1) {
            this.chooseTypeFilter(this.filterOptions[0]);
        }
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


    public chooseTypeFilter(type: IdaiType) {

        this.types = type
            ? [type.name].concat(
                type.children
                    ? type.children.map(childType => childType.name)
                    : []
            )
            : undefined;

        this.onTypesChanged.emit(this.types);
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
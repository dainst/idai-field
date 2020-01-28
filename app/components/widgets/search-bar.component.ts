import {Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnChanges} from '@angular/core';
import {sameset} from 'tsfun';
import {TypeUtility} from '../../core/model/type-utility';
import {IdaiType} from '../../core/configuration/model/idai-type';


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

    @ViewChild('p', {static: false}) protected popover: any;
    @ViewChild('searchInput', {static: false}) fulltextSearchInput: ElementRef;

    public focused: boolean = false;

    private emitQueryTimeout: any = undefined;


    constructor(private typeUtility: TypeUtility) {}


    ngOnChanges() {

        if ((!this.types || this.types.length === 0) && this.filterOptions.length === 1) {
            this.types = [this.filterOptions[0].name];
        }
    }


    public isAllTypesOptionVisible = () => this.filterOptions && this.filterOptions.length > 1;


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

        let newTypes: string[]|undefined = type
            ? this.typeUtility.getNamesOfTypeAndSubtypes(type.name)
            : undefined;

        if (newTypes && newTypes.length > 1 && this.types && sameset(this.types)(newTypes)) {
            newTypes = [type.name];
        }

        this.types = newTypes;
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
            if (target.id && target.id.includes('filter-button')) {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.popover.close();
    }
}
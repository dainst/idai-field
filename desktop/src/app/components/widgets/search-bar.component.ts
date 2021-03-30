import {Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnChanges} from '@angular/core';
import {sameset} from 'tsfun';
import {Category} from 'idai-field-core';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';


@Component({
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

    @Input() filterOptions: Array<Category> = [];
    @Input() showFiltersMenu: boolean = true;

    @Input() q: string = '';
    @Input() categories: string[]|undefined;

    @Output() onCategoriesChanged = new EventEmitter<string[]>();
    @Output() onQueryStringChanged = new EventEmitter<string>();

    @ViewChild('p', { static: false }) protected popover: any;
    @ViewChild('searchInput', { static: false }) fulltextSearchInput: ElementRef;

    public focused: boolean = false;

    private emitQueryTimeout: any = undefined;


    constructor(private projectConfiguration: ProjectConfiguration) {}


    ngOnChanges() {

        if ((!this.categories || this.categories.length === 0) && this.filterOptions.length === 1) {
            this.categories = [this.filterOptions[0].name];
        }
    }


    public isAllCategoriesOptionVisible = () => this.filterOptions && this.filterOptions.length > 1;


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


    public chooseCategoryFilter(category: Category) {

        let newCategories: string[]|undefined = category
            ? Category.getNamesOfCategoryAndSubcategories(category)
            : undefined;

        if (newCategories && newCategories.length > 1 && this.categories
                && sameset(this.categories)(newCategories)) {
            newCategories = [category.name];
        }

        this.categories = newCategories;
        this.onCategoriesChanged.emit(this.categories);
    }


    public blur() {

        this.fulltextSearchInput.nativeElement.blur();
    }


    public handleClick(event: any) {

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

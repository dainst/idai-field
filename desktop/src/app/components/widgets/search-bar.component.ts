import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnChanges } from '@angular/core';
import { sameset } from 'tsfun';
import { CategoryForm } from 'idai-field-core';
import { ComponentHelpers } from '../component-helpers';


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

    @Input() filterOptions: Array<CategoryForm> = [];
    @Input() showFiltersMenu: boolean = true;

    @Input() q: string = '';
    @Input() categories: string[]|undefined;

    @Output() onCategoriesChanged = new EventEmitter<string[]>();
    @Output() onQueryStringChanged = new EventEmitter<string>();

    @ViewChild('p', { static: false }) protected popover: any;
    @ViewChild('searchInput', { static: false }) fulltextSearchInput: ElementRef;

    public focused: boolean = false;

    private emitQueryTimeout: any = undefined;


    public isFilterMenuAvailable = () => this.showFiltersMenu && this.filterOptions.length > 0;


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


    public chooseCategoryFilter(category: CategoryForm) {

        let newCategories: string[]|undefined = category
            ? CategoryForm.getNamesOfCategoryAndSubcategories(category)
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

        if (!ComponentHelpers.isInside(event.target, target =>
                target.id && target.id.includes('filter-button'))) {

            this.popover.close();
        }
    }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Category, Labels } from 'idai-field-core';


@Component({
    selector: 'category-listing',
    templateUrl: './category-listing.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CategoryListingComponent {

    @Input() category: Category;
    @Input() categories: Array<Category> = [];
    @Input() selectedCategory: Category;
    @Input() searchTerm: string = '';

    @Output() onCategorySelected = new EventEmitter<Category>();


    constructor(private labels: Labels) {}


    public selectCategory = (category: Category) => this.onCategorySelected.emit(category);

    public getLabel = (value: any) => this.labels.get(value);


    public getSearchResultLabel(category: Category): string {

        if (this.searchTerm === '') return '';

        return Object.values(category.label).find(translation => {
            return translation.toLocaleLowerCase().startsWith(this.searchTerm.toLocaleLowerCase());
        });
    }
}

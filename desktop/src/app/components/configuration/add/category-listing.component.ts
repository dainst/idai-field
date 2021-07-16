import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Category, Labels } from 'idai-field-core';
import {keysValues, take} from 'tsfun';


@Component({
    selector: 'category-listing',
    templateUrl: './category-listing.html'
})
/**
 * @author Daniel de Oliveira
 */
export class CategoryListingComponent {

    @Input() category: Category;
    @Input() categories: Array<Category> = [];

    @Input() searchTerm: string = '';

    @Output() onCategorySelected = new EventEmitter<Category>();


    constructor(private labels: Labels) {}


    public selectCategory = (category: Category) => this.onCategorySelected.emit(category);

    public getLabel = (value: any) => this.labels.get(value);


    public getLabels(category: Category) {

        if (this.searchTerm === '') return [];

        return take(1, keysValues(category.label)
            .filter(([_, term]) => {
                return term.toLocaleLowerCase().startsWith(this.searchTerm.toLocaleLowerCase());
            }));
    }
}

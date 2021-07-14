import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Category, Labeled } from 'idai-field-core';
import {keysValues} from 'tsfun';


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

    @Output() onCategorySelected = new EventEmitter<Category>();

    public selectCategory = (category: Category) => this.onCategorySelected.emit(category);

    public getLabel = (value: any) => Labeled.getLabel(value);

    public getLabels = (category: Category) => keysValues(category.label);
}

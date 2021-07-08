import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Category, LabelUtil } from 'idai-field-core';


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

    // TODO use label instead of defaultLabel
    public getTranslation = (value: any) => LabelUtil.getTranslation(value);

    public getLabel = (value: any) => LabelUtil.getLabel(value);
}

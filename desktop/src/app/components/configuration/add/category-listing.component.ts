import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CategoryForm, Labels } from 'idai-field-core';


@Component({
    selector: 'category-listing',
    templateUrl: './category-listing.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CategoryListingComponent {

    @Input() category: CategoryForm;
    @Input() categories: Array<CategoryForm> = [];
    @Input() selectedCategory: CategoryForm;
    @Input() searchTerm: string = '';

    @Output() onCategorySelected = new EventEmitter<CategoryForm>();


    constructor(private labels: Labels) {}


    public selectCategory = (category: CategoryForm) => this.onCategorySelected.emit(category);

    public getLabel = (value: any) => this.labels.get(value);


    public getSearchResultLabel(category: CategoryForm): string|undefined {

        if (this.searchTerm === ''
                || this.getLabel(category).toLocaleLowerCase().startsWith(this.searchTerm.toLocaleLowerCase())
                || category.name.toLocaleLowerCase().startsWith(this.searchTerm.toLocaleLowerCase())) {
            return undefined;
        }

        return Object.values(category.label).find(translation => {
            return translation.toLocaleLowerCase().startsWith(this.searchTerm.toLocaleLowerCase());
        });
    }
}

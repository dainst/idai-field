import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CategoryForm, I18N, Labels } from 'idai-field-core';


type CategoryListingItem = {
    name: string;
    form?: CategoryForm;
    label?: I18N.String;
};


@Component({
    selector: 'category-listing',
    templateUrl: './category-listing.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CategoryListingComponent implements OnChanges {

    @Input() categoryForms: Array<CategoryForm> = [];
    @Input() selectedCategory: CategoryForm;
    @Input() searchTerm: string = '';

    @Output() onCategorySelected = new EventEmitter<CategoryForm>();

    public items: Array<CategoryListingItem>;


    constructor(private labels: Labels) {}


    ngOnChanges() {

        this.items = this.createItems();
    }


    public selectCategory = (category: CategoryForm) => this.onCategorySelected.emit(category);

    public getLabel = (value: any) => this.labels.get(value);

    public getForms = (categoryName: string) => this.categoryForms.filter(form => form.name === categoryName);


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

    
    private createItems(): Array<CategoryListingItem> {

        return this.categoryForms.reduce((result, form) => {
            if (result.length === 0 || result[result.length - 1].name !== form.name) {
                console.log()
                result.push({ name: form.name, label: form.label });
            }
            result.push({ name: form.name, form: form });
            return result;
        }, []);
    }
}

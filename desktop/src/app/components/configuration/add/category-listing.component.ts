import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CategoryForm, Labels } from 'idai-field-core';


type CategoryListingItem = {
    form: CategoryForm;
    isCategoryHeader: boolean;
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
    @Input() selectedForm: CategoryForm;
    @Input() searchTerm: string = '';

    @Output() onFormSelected = new EventEmitter<CategoryForm>();

    public items: Array<CategoryListingItem>;


    constructor(private labels: Labels) {}


    ngOnChanges() {

        this.items = this.createItems();
    }


    public selectForm = (form: CategoryForm) => this.onFormSelected.emit(form);

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
            if (result.length === 0 || result[result.length - 1].form.name !== form.name) {
                result.push({ form, isCategoryHeader: true });
            }
            result.push({ form, isCategoryHeader: false });
            return result;
        }, []);
    }
}

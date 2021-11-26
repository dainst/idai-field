import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CategoryForm, I18N, Labels } from 'idai-field-core';
import { getSearchResultLabel } from '../getSearchResultLabel';


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
    @Input() emptyForm: CategoryForm;
    @Input() selectedForm: CategoryForm;
    @Input() searchTerm: string = '';

    @Output() onFormSelected = new EventEmitter<CategoryForm>();

    public items: Array<CategoryListingItem>;


    constructor(private labels: Labels) {}


    ngOnChanges() {

        this.items = this.createItems();
    }


    public selectForm = (form: CategoryForm) => this.onFormSelected.emit(form);

    public getLabel = (value: I18N.LabeledValue) => this.labels.get(value);

    public getForms = (categoryName: string) => this.categoryForms.filter(form => form.name === categoryName);

    public isNewCategoryOptionShown = (): boolean => this.emptyForm
        && !this.items.map(item => item.form.libraryId).includes(this.searchTerm);

    public getSearchResultLabel = (form: CategoryForm) => getSearchResultLabel(form, this.searchTerm, this.getLabel);
    
    
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

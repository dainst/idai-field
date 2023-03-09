import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CategoryForm, ConfigurationDocument, I18N, Labels } from 'idai-field-core';
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
    @Input() configurationDocument: ConfigurationDocument;
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

    public getCategoryLabel = (form: CategoryForm) => this.labels.getFromI18NString(form.categoryLabel);

    public getForms = (categoryName: string) => this.categoryForms.filter(form => form.name === categoryName);

    public isNewCategoryOptionShown = (): boolean => this.emptyForm
        && !this.items.map(item => item.form.libraryId).includes(this.emptyForm.libraryId)
        && !Object.keys(this.configurationDocument.resource.forms).includes(this.emptyForm.libraryId);
    
    public getItemId = (item: CategoryListingItem) => item.isCategoryHeader
        ? 'category-header-' + item.form.name
        : 'select-category-form-' + item.form.libraryId.replace(':', '-');


    public getSearchResultLabel(form: CategoryForm) {

        return getSearchResultLabel(
            form,
            this.searchTerm,
            (value: I18N.LabeledValue) => this.labels.get(value)
        );
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

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { flatten, to } from 'tsfun';
import { CategoryForm, Field, Labels, Named } from 'idai-field-core';
import { getSearchResultLabel } from '../getSearchResultLabel';


@Component({
    selector: 'field-listing',
    templateUrl: './field-listing.html'
})
/**
 * @author Thomas Kleinke
 */
export class FieldListingComponent {

    @Input() fields: Array<Field> = [];
    @Input() category: CategoryForm;
    @Input() emptyField: Field|undefined;
    @Input() selectedField: Field;
    @Input() searchTerm: string = '';

    @Output() onFieldSelected = new EventEmitter<Field>();


    constructor(private labels: Labels) {}


    public select = (field: Field) => this.onFieldSelected.emit(field);

    public getFieldId = (field: Field) => 'select-field-' + field.name.replace(':', '-');

    public getLabel = (value: any) => this.labels.get(value);

    public getSearchResultLabel = (field: Field) => getSearchResultLabel(field, this.searchTerm, this.getLabel);


    public isNewFieldOptionShown(): boolean {

        const existingFieldsNames: string[] = flatten(
            this.category.children.map(subcategory => CategoryForm.getFields(subcategory))
        ).concat(CategoryForm.getFields(this.category))
            .map(to(Named.NAME));

        return this.emptyField !== undefined
            && !this.fields.map(to(Named.NAME)).includes(this.emptyField.name)
            && !existingFieldsNames.includes(this.emptyField.name);
    };
}

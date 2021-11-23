import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Field, Labels } from 'idai-field-core';


@Component({
    selector: 'field-listing',
    templateUrl: './field-listing.html'
})
/**
 * @author Thomas Kleinke
 */
export class FieldListingComponent {

    @Input() fields: Array<Field> = [];
    @Input() emptyField: Field|undefined;
    @Input() selectedField: Field;
    @Input() searchTerm: string = '';

    @Output() onFieldSelected = new EventEmitter<Field>();


    constructor(private labels: Labels) {}


    public select = (field: Field) => this.onFieldSelected.emit(field);

    public getLabel = (value: any) => this.labels.get(value);

    public isNewFieldOptionShown = (): boolean => this.emptyField !== undefined
        && !this.fields.map(field => field.name).includes(this.searchTerm);


    // TODO Extract to util
    public getSearchResultLabel(field: Field): string|undefined {

        if (this.searchTerm === ''
                || this.getLabel(field).toLocaleLowerCase().startsWith(this.searchTerm.toLocaleLowerCase())
                || field.name.toLocaleLowerCase().startsWith(this.searchTerm.toLocaleLowerCase())) {
            return undefined;
        }

        return Object.values(field.label).find(translation => {
            return translation.toLocaleLowerCase().startsWith(this.searchTerm.toLocaleLowerCase());
        });
    }
}

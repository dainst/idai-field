import { Component, Input, OnChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { UtilTranslations } from '../../../../../util/util-translations';
import { Field, FieldsViewField, FieldsViewUtil, ProjectConfiguration, Resource, CategoryForm,
    FieldsViewSubfield, Labels } from 'idai-field-core';


@Component({
    selector: 'invalid-field-data',
    templateUrl: './invalid-field-data.html'
})
/**
 * @author Thomas Kleinke
 */
export class InvalidFieldDataComponent implements OnChanges {

    @Input() resource: Resource;
    @Input() field: Field;

    public fieldsViewField: FieldsViewField;
    public fieldDataLabel: string;


    constructor(private projectConfiguration: ProjectConfiguration,
                private labels: Labels,
                private utilTranslations: UtilTranslations,
                private decimalPipe: DecimalPipe) {}


    async ngOnChanges() {

        this.fieldDataLabel = this.createFieldDataLabel();
    }


    public delete() {

        delete this.resource[this.field.name];
    }


    private createFieldDataLabel(): string {

        const category: CategoryForm = this.projectConfiguration.getCategory(this.resource.category);

        const field: FieldsViewSubfield = {
            name: this.field.name,
            valuelist: CategoryForm.getField(category, this.field.name)?.valuelist
        } as unknown as FieldsViewSubfield;
    
        return FieldsViewUtil.getLabel(
            field,
            this.resource[this.field.name],
            this.labels,
            (key: string) => this.utilTranslations.getTranslation(key),
            (value: number) => this.decimalPipe.transform(value),
        );
    }
}

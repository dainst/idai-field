import { Component, Input, OnChanges } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { FieldResource, InvalidDataUtil, Labels, Resource } from 'idai-field-core';


type InvalidResourceViewField = {
    name: string;
    contentLabel: string;
};


@Component({
    selector: 'invalid-resource-view',
    templateUrl: './invalid-resource-view.html'
})
/**
 * @author Thomas Kleinke
 */
export class InvalidResourceViewComponent implements OnChanges {

    @Input() resource: Resource;

    public fields: Array<InvalidResourceViewField> = [];


    constructor(private labels: Labels,
                private i18n: I18n) {}


    ngOnChanges() {
        
        this.fields = this.initializeFields();
    }


    private initializeFields(): Array<InvalidResourceViewField> {

        const fieldsToExclude: string[] = [Resource.ID, Resource.RELATIONS, Resource.IDENTIFIER, Resource.CATEGORY];

        const defaultFields: Array<InvalidResourceViewField> = [
            this.getField(Resource.IDENTIFIER),
            this.getField(Resource.CATEGORY)
        ].filter(field => field !== undefined);

        const otherFields: Array<InvalidResourceViewField> = Object.keys(this.resource)
            .filter(fieldName => !fieldsToExclude.includes(fieldName))
            .map(fieldName => this.getField(fieldName));

        return defaultFields.concat(otherFields);
    }


    private getField(fieldName: string): InvalidResourceViewField {

        if (this.resource[fieldName] === undefined) return undefined;

        return {
            name: this.getFieldNameLabel(fieldName),
            contentLabel: InvalidDataUtil.generateLabel(this.resource[fieldName], this.labels)
        };
    }


    private getFieldNameLabel(fieldName: string): string {

        switch (fieldName) {
            case Resource.IDENTIFIER:
                return this.i18n({ id: 'config.inputType.identifier', value: 'Bezeichner' });
            case Resource.CATEGORY:
                return this.i18n({ id: 'config.inputType.category', value: 'Kategorie' });
            case FieldResource.GEOMETRY:
                return this.i18n({ id: 'config.inputType.geometry', value: 'Geometrie' });
            default:
                return fieldName;
        }
    }
}

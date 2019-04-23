import {Component, OnChanges, Input} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {to, isUndefinedOrEmpty} from 'tsfun';
import {Resource, ProjectConfiguration} from 'idai-components-2';


@Component({
    selector: 'fields-view',
    moduleId: module.id,
    templateUrl: './fields-view.html'
})

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class FieldsViewComponent implements OnChanges {

    @Input() resource: Resource;

    public fields: Array<any>;


    constructor(private projectConfiguration: ProjectConfiguration,
                private i18n: I18n) {}


    ngOnChanges() {

        this.fields = [];
        if (this.resource) this.processFields(this.resource);
    }


    public isBoolean(value: any): boolean {

        return typeof value === 'boolean';
    }


    private processFields(resource: Resource) {

        const fieldNames = this.projectConfiguration
            .getFieldDefinitions(resource.type)
            .map(to('name'));

        for (let fieldName of fieldNames) {
            if (fieldName === 'relations') continue;
            if (resource[fieldName] === undefined) continue;

            if (fieldName === 'period') {
                this.fields.push({
                    name: this.i18n({
                        id: 'components.documents.docView.fieldsView.period',
                        value: 'Grobdatierung'
                    }) + (!isUndefinedOrEmpty(resource['periodEnd'])
                        ? this.i18n({
                        id: 'components.documents.docView.fieldsView.period.from',
                        value: ' (von)'
                    }) : ''),
                    value: FieldsViewComponent.getValue(resource, fieldName),
                    isArray: false
                });

                if (!isUndefinedOrEmpty(resource['periodEnd'])) {
                    this.fields.push({
                        name: this.i18n({
                            id: 'components.documents.docView.fieldsView.period.to',
                            value: 'Grobdatierung (bis)'
                        }),
                        value: FieldsViewComponent.getValue(resource, 'periodEnd'),
                        isArray: false
                    });
                }
                continue;
            }

            if (!this.projectConfiguration.isVisible(resource.type, fieldName)) continue;

            this.fields.push({
                name: this.projectConfiguration.getFieldDefinitionLabel(resource.type, fieldName),
                value: FieldsViewComponent.getValue(resource, fieldName),
                isArray: Array.isArray(resource[fieldName])
            });
        }
    }


    private static getValue(resource: Resource, fieldName: string): any {

        if (typeof resource[fieldName] === 'string') {
            return resource[fieldName]
                .replace(/^\s+|\s+$/g, '')
                .replace(/\n/g, '<br>');
        } else {
            return resource[fieldName];
        }
    }
}
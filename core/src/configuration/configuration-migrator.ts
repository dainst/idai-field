import { isString } from 'tsfun';
import { DateConfiguration } from '../model/configuration/date-configuration';
import { Field } from '../model/configuration/field';
import { Reference } from '../model/configuration/reference';
import { ConfigurationResource } from '../model/document/configuration-resource';
import { CustomFieldDefinition } from './model/field/custom-field-definition';
import { Valuelist } from '../model/configuration/valuelist';
import { ValuelistValue } from '../model/configuration/valuelist-value';
import { CustomFormDefinition } from './model/form/custom-form-definition';


/**
 * @author Thomas Kleinke
 */
export module ConfigurationMigrator {

    export function migrate(configurationResource: ConfigurationResource) {

        migrateDates(configurationResource);
        migrateReferences(configurationResource);
    }


    function migrateDates(configurationResource: ConfigurationResource) {

        Object.values(configurationResource.forms).forEach(form => {
            if (!form.groups) return;

            form.groups.forEach(group => {
                if (group.fields.includes('beginningDate') || group.fields.includes('endDate')) {
                    const index: number = group.fields.indexOf('beginningDate');
                    group.fields = group.fields.filter(field => !['beginningDate', 'endDate'].includes(field));
                    if (!group.fields.includes('date')) group.fields.splice(index, 0, 'date');
                }

                if (form.hidden) {
                    if (form.hidden.includes('beginningDate') && form.hidden.includes('endDate')
                            && !form.hidden.includes('date')) {
                        form.hidden.push('date');
                    }
                    form.hidden = form.hidden.filter(field => !['beginningDate', 'endDate'].includes(field));
                }
            });

            Object.values(form.fields)
                .filter(field => field.inputType === Field.InputType.DATE)
                .forEach(field => {
                    if (!field.dateConfiguration) {
                        field.dateConfiguration = {
                            dataType: DateConfiguration.DataType.OPTIONAL,
                            inputMode: DateConfiguration.InputMode.OPTIONAL
                        };
                    }
                });
        });
    }


    function migrateReferences(configurationResource: ConfigurationResource) {

        Object.values(configurationResource.forms).forEach(form => {
            migrateReferencesInObject(form);

            Object.values(form.fields).forEach(field => {
                migrateReferencesInObject(field);

                if (field.subfields) {
                    Object.values(field.subfields).forEach(subfield => {
                        migrateReferencesInObject(subfield);
                    })
                }
            })
        });

        Object.values(configurationResource.valuelists).forEach(valuelist => {
            migrateReferencesInObject(valuelist);

            Object.values(valuelist.values).forEach(value => {
                migrateReferencesInObject(value);
            });
        });
    }


    function migrateReferencesInObject(object: CustomFormDefinition|CustomFieldDefinition|Valuelist|ValuelistValue) {

        if (object.references) object.references = getReferences(object.references);
    }


    function getReferences(references: any[]): Array<Reference> {

        return references.map(entry => {
            return isString(entry)
                ? getReference(entry)
                : entry;
            });
    }


    function getReference(uri: string): Reference {

        return {
            predicate: 'idw:unknownMatch',
            uri
        };
    }
}

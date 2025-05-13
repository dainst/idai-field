import { DateConfiguration } from '../model/configuration/date-configuration';
import { Field } from '../model/configuration/field';
import { ConfigurationResource } from '../model/document/configuration-resource';


/**
 * @author Thomas Kleinke
 */
export module ConfigurationMigrator {

    export function migrate(configurationResource: ConfigurationResource) {

        migrateDates(configurationResource);
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
}

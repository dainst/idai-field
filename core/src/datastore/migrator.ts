import { isArray, isObject } from 'tsfun';
import { Document } from '../model/document/document';
import { OptionalRange } from '../model/input-types/optional-range';
import { CategoryForm } from '../model/configuration/category-form';
import { Field } from '../model/configuration/field';
import { ProjectConfiguration } from '../services';


export const singleToMultipleValuesFieldNames: string[] = [
    'processor',
    'supervisor',
    'draughtsmen',
    'campaign',
    'archaeoDox:distinguishingCriterium'
];


/**
 * @author Thomas Kleinke
 */
export module Migrator {

    /**
     * @param document is modified in place
     * */
    export function migrate(document: Document, projectConfiguration: ProjectConfiguration) {

        migrateGeneralFieldsAndRelations(document);
        migratePeriodFields(document);
        migrateSingleToMultipleValues(document);
        migrateDatings(document, projectConfiguration);
    }


    function migratePeriodFields(document: Document) {

        const PERIOD = 'period';
        const PERIODEND = 'periodEnd';

        if (document.resource[PERIOD] && !isObject(document.resource[PERIOD])) {

            document.resource[PERIOD] = {
                value: document.resource[PERIOD]
            };
            if (document.resource[PERIODEND]) {
                document.resource[PERIOD][OptionalRange.ENDVALUE] = document.resource[PERIODEND];
                delete document.resource[PERIODEND];
            }
        }
    }


    function migrateGeneralFieldsAndRelations(document: Document) {

        if (document.resource.relations) delete document.resource.relations['includes'];

        if (document.resource.type) {
            document.resource.category = document.resource['type'];
            delete document.resource['type'];
        }
    }


    function migrateSingleToMultipleValues(document: Document) {

        singleToMultipleValuesFieldNames.forEach((fieldName: string) => {
           if (document.resource[fieldName] && !Array.isArray(document.resource[fieldName])) {
               document.resource[fieldName] = [document.resource[fieldName]];
           }
        });
    }


    function migrateDatings(document: Document, projectConfiguration: ProjectConfiguration) {
        const category: CategoryForm = projectConfiguration.getCategory(document);
        if (!category) return;

        CategoryForm.getFields(category)
            .filter(field => field.inputType === Field.InputType.DATING)
            .forEach(field => {
                const datings = document.resource[field.name];
                if (!datings || !isArray(datings)) return;
                datings.forEach(dating => {
                    if (dating.type === 'exact') dating.type = 'single';
                })
            });
    }
}

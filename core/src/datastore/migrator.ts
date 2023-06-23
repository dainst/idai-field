import { flow, isObject } from 'tsfun';
import { Document } from '../model/document';
import { OptionalRange } from '../model/optional-range';


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

    export function migrate(document: Document): Document {

        return flow(
            document,
            migrateGeneralFieldsAndRelations,
            migratePeriodFields,
            migrateSingleToMultipleValues
        );
    }


    /**
     * @param document modified in place
     * @return the original, now modified document
     */
    function migratePeriodFields(document: Document): Document {

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
        return document;
    }


    function migrateGeneralFieldsAndRelations(document: Document): Document {

        if (document.resource.relations) delete document.resource.relations['includes'];

        if (document.resource.type) {
            document.resource.category = document.resource['type'];
            delete document.resource['type'];
        }
        return document;
    }


    function migrateSingleToMultipleValues(document: Document): Document {

        singleToMultipleValuesFieldNames.forEach((fieldName: string) => {
           if (document.resource[fieldName] && !Array.isArray(document.resource[fieldName])) {
               document.resource[fieldName] = [document.resource[fieldName]];
           }
        });

        return document;
    }
}

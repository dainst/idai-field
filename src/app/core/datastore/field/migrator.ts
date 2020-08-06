import {isObject, flow} from 'tsfun';
import {Document, ValOptionalEndVal} from 'idai-components-2';
import {migrationMap, singleToMultipleValuesFieldNames} from './migration-map';


/**
 * @author Thomas Kleinke
 */
export module Migrator {

    export function migrate(document: Document): Document {

        return flow(
            document,
            migrateFieldNames,
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
                document.resource[PERIOD][ValOptionalEndVal.ENDVALUE] = document.resource[PERIODEND];
                delete document.resource[PERIODEND];
            }
        }
        return document;
    }


    function migrateFieldNames(document: Document): Document {

        const resource: any = {};

        if (document.resource.relations) delete document.resource.relations['includes'];

        Object.keys(document.resource).forEach((fieldName: string) => {
           const newFieldName: string = migrationMap[fieldName] ? migrationMap[fieldName] : fieldName;

           resource[newFieldName] = document.resource[fieldName];
           // TODO no deletion of original field?
        });

        document.resource = resource;

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

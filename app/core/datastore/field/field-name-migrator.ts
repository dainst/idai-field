import {Document} from 'idai-components-2';
import {migrationMap, subFieldsMigrationMap} from './migration-map';
import {isObject} from 'tsfun';


/**
 * @author Thomas Kleinke
 */
export module FieldNameMigrator {

    export function migrate(document: Document): Document {

        const resource: any = {};

        Object.keys(document.resource).forEach((fieldName: string) => {
           const newFieldName: string = migrationMap[fieldName] ? migrationMap[fieldName] : fieldName;

           let field: any = document.resource[fieldName];
           if (Array.isArray(field) && (field.some(isObject))) field = migrateArrayField(field);

           resource[newFieldName] = field;
        });

        document.resource = resource;

        return document;
    }


    function migrateArrayField(arrayField: any[]): any[] {

        const result: any[] = [];

        arrayField.forEach(entry => {
            result.push(isObject(entry) ? migrateSubFieldNames(entry) : entry);
        });

        return result;
    }


    function migrateSubFieldNames(object: any): any {

        const result: any = {};

        Object.keys(object).forEach((fieldName: string) => {
            const newFieldName: string = subFieldsMigrationMap[fieldName]
                ? subFieldsMigrationMap[fieldName]
                : fieldName;
            result[newFieldName] = object[fieldName];
        });

        return result;
    }
}
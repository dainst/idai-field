import {Document} from 'idai-components-2';
import {migrationMap} from './migration-map';

/**
 * @author Thomas Kleinke
 */
export module FieldNameMigrator {

    export function migrate(document: Document): Document {

        const resource: any = {};

        Object.keys(document.resource).forEach((fieldName: string) => {
           const newFieldName: string = migrationMap[fieldName] ? migrationMap[fieldName] : fieldName;
           resource[newFieldName] = document.resource[fieldName];
        });

        document.resource = resource;

        return document;
    }
}
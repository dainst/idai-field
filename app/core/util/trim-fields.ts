import {isNot, includedIn, isObject, isArray, keys} from 'tsfun';
import {Resource} from 'idai-components-2';

const defaultFields: string[] = ['id', 'relations', 'type', 'geometry', 'georeference'];


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function trimFields(resource: Resource) {

    trim(resource, true);
}


function trim(object: any, ignoreDefaultFields: boolean) {

    const fieldsToIgnore: string[] = ignoreDefaultFields ? defaultFields : [];

    (keys(object) as any)
        .filter(isNot(includedIn(fieldsToIgnore)))
        .forEach((fieldName: any) => {
            const value = object[fieldName];
            if (typeof value === 'string') {
                object[fieldName] = value.trim();
            } else if (isObject(value) || isArray(value)) {
                trim(value, false);
            }
        });
}
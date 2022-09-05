import { isNot, includedIn, isObject, isArray, pairWith, lookup } from 'tsfun';
import { Resource } from 'idai-field-core';

const defaultFields: string[] = ['id', 'relations', 'category', 'geometry', 'georeference'];


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function trimFields(resource: Resource) {

    trim(resource, true);
}


function trim(object: any, ignoreDefaultFields: boolean) {

    const fieldsToIgnore: string[] = ignoreDefaultFields ? defaultFields : [];

    (Object.keys(object) as any)
        .filter(isNot(includedIn(fieldsToIgnore)))
        .map(pairWith(lookup(object)))
        .forEach(([fieldName, value]: [string, any]) => {
            if (typeof value === 'string') {
                object[fieldName] = value.trim();
            } else if (isObject(value) || isArray(value)) {
                trim(value, false);
            }
        });
}

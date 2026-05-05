import { detach } from 'tsfun';
import { Document, ImageResource, Resource } from 'idai-field-core';
import { trimFields } from '../../../util/trim-fields';
import { removeNullProperties } from './remove-null-properties';


const FIELDS_TO_IGNORE = [ImageResource.WIDTH, ImageResource.HEIGHT, ImageResource.ORIGINAL_FILENAME];


/**
 * Trims leading and trailing empty characters.
 * Converts nulls to undefined values.
 *
 * @param documents modified in place
 * @param permitDeletions if set to false, all nulls get converted to undefined values.
 *   Nested associative structures will be collapsed.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function preprocessFields(documents: Array<Document>,
                                 { permitDeletions }: {permitDeletions?: boolean}): void {

    documents.forEach(preprocessFieldsForResource(!permitDeletions));
}


function preprocessFieldsForResource(removeNulls: boolean) { return (document: Document) => {

    trimFields(document.resource);

    FIELDS_TO_IGNORE.forEach(fieldName => delete document.resource[fieldName]);

    if (removeNulls) {
        const relations = document.resource.relations;
        document.resource = removeNullProperties(detach('relations')(document.resource)) as Resource;
        document.resource.relations = relations;
    }
}}

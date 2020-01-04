import {dissoc} from 'tsfun';
import {Document} from 'idai-components-2';
import {trimFields} from '../../util/trim-fields';
import {collapseEmptyProperties} from './collapse-empty-properties';


/**
 * TODO merge preprocessFields and preprocessDocuments
 *
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
export function preprocessFields(documents: Array<Document>, permitDeletions: boolean): void {

    documents.forEach(preprocessFieldsForResource(!permitDeletions));
}


function preprocessFieldsForResource(convertNulls: boolean) { return (document: Document) => {

    trimFields(document.resource);

    if (convertNulls) {

        const relations = document.resource.relations;
        document.resource = collapseEmptyProperties(dissoc('relations')(document.resource));
        document.resource.relations = relations;
    }
}}
import {Document} from 'idai-components-2/core';

/**
 * @author: Thomas Kleinke
 */
export class ModelUtil {

    public static getDocumentLabel(document: Document): string {

        if (document.resource.shortDescription) {
            return document.resource.shortDescription + ' (' + document.resource.identifier + ')';
        } else {
            return document.resource.identifier;
        }
    }
}
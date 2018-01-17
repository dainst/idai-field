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


    public static isInList(document: Document, documents: Array<Document>): boolean {

        return documents.map(document => document.resource.id)
            .indexOf(document.resource.id) > -1;
    }


    public static getRelationTargetId(document: Document, relationName: string, index: number): string|undefined {

        return (document.resource.relations[relationName]
                && document.resource.relations[relationName].length > index) ?
            document.resource.relations[relationName][index] :
            undefined;
    }
}
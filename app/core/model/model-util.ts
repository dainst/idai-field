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


    public static hasRelationTarget(document: Document, relationName: string, targetId: string): boolean {

        if (!document.resource.relations[relationName]) return false;

        return document.resource.relations[relationName].indexOf(targetId) > -1;
    }


    public static hasRelations(document: Document, relationName: string): boolean {

        return document.resource.relations[relationName] && document.resource.relations[relationName].length > 0;
    }
}
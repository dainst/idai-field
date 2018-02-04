import {Document} from 'idai-components-2/core';
import {getAtIndex} from '../../util/list/list-util';

/**
 * @author: Thomas Kleinke
 */
export class ModelUtil {

    public static getDocumentLabel(document: Document): string {

        return (document.resource.shortDescription)
            ? document.resource.shortDescription + ' (' + document.resource.identifier + ')'
            : document.resource.identifier;
    }


    public static getRelationTargetId(document: Document, relationName: string, index: number): string|undefined {

        const targetIds: string[]|undefined = document.resource.relations[relationName];
        if (!targetIds) return undefined;

        return getAtIndex(targetIds, index);
    }


    public static hasRelationTarget(document: Document, relationName: string, targetId: string): boolean {

        if (!document.resource.relations[relationName]) return false;

        return document.resource.relations[relationName].indexOf(targetId) > -1;
    }


    public static hasRelations(document: Document, relationName: string): boolean {

        return document.resource.relations[relationName] && document.resource.relations[relationName].length > 0;
    }
}


export const hasEqualId = (l: Document|undefined) => (r: Document): boolean => (l != undefined && l.resource.id == r.resource.id);

export const hasId = (doc: Document) => doc.resource.id != undefined;

export const toResourceId = (doc: Document) => doc.resource.id as string;
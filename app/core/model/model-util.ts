import {Document} from 'idai-components-2';
import {nthOr} from 'tsfun';

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

        return nthOr(index, undefined as any)(targetIds);
    }
}


export const hasEqualId = (l: Document|undefined) =>
    (r: Document): boolean => (l != undefined && l.resource.id === r.resource.id);

export const hasId = (doc: Document) => doc.resource.id !== undefined;


import {Document} from 'idai-components-2';
import {nthOr} from 'tsfun';
import {ResourceId} from '../../c';

/**
 * @author: Thomas Kleinke
 */
export module ModelUtil {

    export type Label = string;

    export function getDocumentLabel(document: Document): Label {

        return (document.resource.shortDescription)
            ? document.resource.shortDescription + ' (' + document.resource.identifier + ')'
            : document.resource.identifier;
    }


    export function getRelationTargetId(document: Document, relationName: string, index: number): ResourceId|undefined {

        const targetIds: string[]|undefined = document.resource.relations[relationName];
        if (!targetIds) return undefined;

        return nthOr(index, undefined as any)(targetIds);
    }
}

export const hasEqualId = (l: Document|undefined) => (r: Document): boolean => (l != undefined && l.resource.id === r.resource.id);

export const hasId = (doc: Document) => doc.resource.id !== undefined;




import {Document, FieldDefinition, NewResource, Resource} from 'idai-components-2';
import {includedIn, is, isNot, nthOr, on} from 'tsfun';
import {INPUT_TYPE} from '../../c';

/**
 * @author: Thomas Kleinke
 */
export module ModelUtil {

    export type Label = string;
    export type ResourceId = string;


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

export const hasEqualId = (l: Document|undefined) => // TODO reimplement
    (r: Document): boolean => (l != undefined && l.resource.id === r.resource.id);

export const hasId = (doc: Document) => doc.resource.id !== undefined;




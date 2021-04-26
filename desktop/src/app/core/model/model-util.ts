import { FieldResource, ResourceId } from 'idai-field-core';
import { Document, Resource } from 'idai-field-core';
import { to } from 'tsfun';

/**
 * @author: Thomas Kleinke
 */
export module ModelUtil {

    export type Label = string;


    export function getDocumentLabel(document: Document): Label { // TODO move to Document

        return (document.resource.shortDescription)
            ? document.resource.shortDescription + ' (' + document.resource.identifier + ')'
            : document.resource.identifier;
    }


    export function getRelationTargetId(document: Document,
                                        relationName: string,
                                        index: number): ResourceId|undefined {

        const targetIds: string[]|undefined = document.resource.relations[relationName];
        if (!targetIds) return undefined;

        return to(index)(targetIds) as (ResourceId|undefined);
    }


    export function getMainImageId(resource: FieldResource): string|undefined {

        if (!Resource.hasRelations(resource, 'isDepictedIn')) return undefined;

        return resource.relations['isDepictedIn'][0];
    }


    export const hasEqualId = (l: Document|undefined) => (r: Document): boolean => (l != undefined && l.resource.id === r.resource.id);

    export const hasId = (doc: Document) => doc.resource.id !== undefined; // TODO this could be done with a NewDocument typeguard
}

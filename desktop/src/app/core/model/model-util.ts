import { to } from 'tsfun';
import { FieldResource, ResourceId, Document, Resource } from 'idai-field-core';


/**
 * @author: Thomas Kleinke
 */
export module ModelUtil {

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
}

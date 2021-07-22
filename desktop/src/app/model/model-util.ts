import { to } from 'tsfun';
import { FieldResource, Document, Resource } from 'idai-field-core';


/**
 * @author: Thomas Kleinke
 */
export module ModelUtil {

    export function getRelationTargetId(document: Document,
                                        relationName: string,
                                        index: number): Resource.Id|undefined {

        const targetIds: string[]|undefined = document.resource.relations[relationName];
        if (!targetIds) return undefined;

        return to(index)(targetIds) as (Resource.Id|undefined);
    }


    export function getMainImageId(resource: FieldResource): string|undefined {

        if (!Resource.hasRelations(resource, 'isDepictedIn')) return undefined;

        return resource.relations['isDepictedIn'][0];
    }
}

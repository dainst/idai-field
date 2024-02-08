import { filter, flow, isDefined, map } from 'tsfun';
import { Constraints, Datastore, FieldDocument, Query, Resource } from 'idai-field-core';
import { PLACEHOLDER } from '../components/image/row/image-row';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module LinkedImagesUtil {

    /**
     * Returns images of linked finds. If the resources are not directly linked to an image,
     * the images of finds linked to the resources (or their sub resources) are returned.
     */
    export function getLinkedImageIds(document: FieldDocument, datastore: Datastore,
                                      linkRelationName: string): string[] {

        const linkedImageIds: string[] = getLinkedImagesForResource(document.resource.id, datastore, linkRelationName);
        if (linkedImageIds.length > 0) {
            return linkedImageIds;
        } else {
            return getLinkedImagesForSubResources(document.resource.id, datastore, linkRelationName);
        }
    }


    function getLinkedImagesForSubResources(resourceId: Resource.Id, datastore: Datastore,
                                             linkRelationName: string): string[] {

        const query: Query = {
            constraints: { 'isChildOf:contain': { value: resourceId } }
        };

        const resourceIds: string[] = datastore.findIds(query).ids;

        return flow(
            resourceIds,
            map(getImage(datastore, linkRelationName)),
            filter(isDefined));
    }


    function getImage(datastore: Datastore, linkRelationName: string) {

        return (resourceId: string): string|undefined => {

            let imageId: string|undefined = getMainImageId(resourceId, datastore);

            if (imageId) {
                return imageId;
            } else {
                let linkedImageIds: string[] = getLinkedImagesForResource(resourceId, datastore, linkRelationName);
                if (linkedImageIds.length > 0) {
                    return linkedImageIds[0];
                } else {
                    linkedImageIds = getLinkedImagesForSubResources(resourceId, datastore, linkRelationName);
                    return linkedImageIds.length > 0
                        ? linkedImageIds[0]
                        : undefined;
                }
            }
        }
    }


    function getLinkedImagesForResource(resourceId: Resource.Id, datastore: Datastore,
                                    linkRelationName: string): string[] {

        const constraints: Constraints = {};
        constraints[linkRelationName + ':contain'] = resourceId;

        const query: Query = { constraints };

        const ids: string[] = datastore.findIds(query).ids;
        const result: string[] = [];

        for (let id of ids) {
            const imageId: string|undefined = getMainImageId(id, datastore);
            result.push(imageId ? imageId : PLACEHOLDER);
        }

        return result;
    }


    function getMainImageId(resourceId: string, datastore: Datastore): string|undefined {

        const query: Query = {
            constraints: { 'isDepictedIn:links': resourceId },
            sort: { mode: 'none' }
        };

        const ids: string[] = datastore.findIds(query).ids;

        return ids.length > 0 ? ids[0] : undefined;
    }
}

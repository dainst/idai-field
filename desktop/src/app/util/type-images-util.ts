import { filter, flow, isDefined, map } from 'tsfun';
import { Constraints, Datastore, FieldDocument, Query, Resource } from 'idai-field-core';
import { PLACEHOLDER } from '../components/image/row/image-row';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module TypeImagesUtil {

    /**
     * @param document: A document of category Type or TypeCatalog
     *
     * Returns images of linked finds (for types). If the types of a
     * type catalog are not directly linked to an image, the images of finds linked to the types are returned.
     */
    export function getLinkedImageIds(document: FieldDocument, datastore: Datastore,
                                      linkRelationName: string): string[] {

        const linkedImageIds: string[] = getLinkedImagesForType(document.resource.id, datastore, linkRelationName);
        if (linkedImageIds.length > 0) {
            return linkedImageIds;
        } else {
            return getLinkedImagesFromSubResources(document.resource.id, datastore, linkRelationName);
        }
    }


    function getLinkedImagesFromSubResources(resourceId: Resource.Id, datastore: Datastore,
                                             linkRelationName: string): string[] {

        const query: Query = {
            constraints: { 'isChildOf:contain': { value: resourceId } }
        };

        const resourceIds: string[] = datastore.findIds(query).ids;

        return flow(
            resourceIds,
            map(getTypeImage(datastore, linkRelationName)),
            filter(isDefined));
    }


    function getTypeImage(datastore: Datastore, linkRelationName: string) {

        return (resourceId: string): string|undefined => {

            let imageId: string|undefined = getMainImageId(resourceId, datastore);

            if (imageId) {
                return imageId;
            } else {
                let linkedImageIds: string[] = getLinkedImagesForType(resourceId, datastore, linkRelationName);
                if (linkedImageIds.length > 0) {
                    return linkedImageIds[0];
                } else {
                    linkedImageIds = getLinkedImagesFromSubResources(resourceId, datastore, linkRelationName);
                    return linkedImageIds.length > 0
                        ? linkedImageIds[0]
                        : undefined;
                }
            }
        }
    }


    function getLinkedImagesForType(resourceId: Resource.Id, datastore: Datastore,
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

import { Datastore, FieldDocument, Query, ResourceId } from 'idai-field-core';
import { filter, flow, isDefined, map } from 'tsfun';
import { ImageDatastore } from '../datastore/field/image-datastore';
import { PLACEHOLDER } from '../images/row/image-row';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module TypeImagesUtil {

    /**
     * @param document: A document of category Type or TypeCatalog
     *
     * Returns images of linked categories (for type catalogs) or finds (for categories). If the categories linked to a
     * type catalog are not directly linked to an image, the images of finds linked to the categories are returned.
     */
    export function getLinkedImageIds(document: FieldDocument,
                                      datastore: Datastore,
                                      imageDatastore: ImageDatastore): string[] {

        if (document.resource.category !== 'Type' && document.resource.category !== 'TypeCatalog') {
            throw 'Illegal argument: Document must be of category Type or TypeCatalog.';
        }

        return document.resource.category === 'TypeCatalog'
            ? getLinkedImagesForTypeCatalog(document.resource.id, datastore, imageDatastore)
            : getLinkedImagesForType(document.resource.id, datastore, imageDatastore);
    }


    function getLinkedImagesForTypeCatalog(resourceId: ResourceId,
                                           datastore: Datastore,
                                           imageDatastore: ImageDatastore): string[] {

        const query: Query = {
            constraints: { 'liesWithin:contain': resourceId }
        };

        const resourceIds: string[] = datastore.findIds(query, true).ids;

        return flow(
            resourceIds,
            map(getTypeImage(datastore, imageDatastore)),
            filter(isDefined));
    }


    function getTypeImage(datastore: Datastore, imageDatastore: ImageDatastore) {

        return (resourceId: string): string|undefined => {

            let imageId: string|undefined = getMainImageId(resourceId, imageDatastore);

            if (imageId) {
                return imageId;
            } else {
                const linkedImageIds: string[] = getLinkedImagesForType(resourceId, datastore, imageDatastore);

                return linkedImageIds.length > 0
                    ? linkedImageIds[0]
                    : undefined;
            }
        }
    }


    function getLinkedImagesForType(resourceId: ResourceId,
                                    datastore: Datastore,
                                    imageDatastore: ImageDatastore): string[] {

        const query: Query = {
            constraints: { 'isInstanceOf:contain': resourceId }
        };

        const ids: string[] = datastore.findIds(query, true).ids;
        const result: string[] = [];

        for (let id of ids) {
            const imageId: string|undefined = getMainImageId(id, imageDatastore);
            result.push(imageId ? imageId : PLACEHOLDER);
        }

        return result;
    }


    function getMainImageId(resourceId: string, imageDatastore: ImageDatastore): string|undefined {

        const query: Query = {
            constraints: { 'isDepictedIn:links': resourceId },
            sort: { mode: 'none' }
        };

        const ids: string[] = imageDatastore.findIds(query, true).ids;

        return ids.length > 0 ? ids[0] : undefined;
    }
}

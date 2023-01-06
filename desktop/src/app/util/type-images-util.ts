import { filter, flow, isDefined, map } from 'tsfun';
import { Datastore, FieldDocument, Query, Resource } from 'idai-field-core';
import { PLACEHOLDER } from '../components/image/row/image-row';


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
    export function getLinkedImageIds(document: FieldDocument, datastore: Datastore,
                                      typeCategoryNames: string[]): string[] {

        if (!typeCategoryNames.includes(document.resource.category) && document.resource.category !== 'TypeCatalog') {
            throw 'Illegal argument: Document must be of category Type (or subcategory) or TypeCatalog.';
        }

        return document.resource.category === 'TypeCatalog'
            ? getLinkedImagesForTypeCatalog(document.resource.id, datastore)
            : getLinkedImagesForType(document.resource.id, datastore);
    }


    function getLinkedImagesForTypeCatalog(resourceId: Resource.Id,
                                           datastore: Datastore): string[] {

        const query: Query = {
            constraints: { 'isChildOf:contain': resourceId }
        };

        const resourceIds: string[] = datastore.findIds(query).ids;

        return flow(
            resourceIds,
            map(getTypeImage(datastore)),
            filter(isDefined));
    }


    function getTypeImage(datastore: Datastore) {

        return (resourceId: string): string|undefined => {

            let imageId: string|undefined = getMainImageId(resourceId, datastore);

            if (imageId) {
                return imageId;
            } else {
                const linkedImageIds: string[] = getLinkedImagesForType(resourceId, datastore);

                return linkedImageIds.length > 0
                    ? linkedImageIds[0]
                    : undefined;
            }
        }
    }


    function getLinkedImagesForType(resourceId: Resource.Id,
                                    datastore: Datastore): string[] {

        const query: Query = {
            constraints: { 'isInstanceOf:contain': resourceId }
        };

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

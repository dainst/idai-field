import {isDefined, filter} from 'tsfun';
import {map as asyncMap, flow as asyncFlow} from 'tsfun/async';
import {FieldDocument} from 'idai-components-2';
import {FieldReadDatastore} from '../datastore/field/field-read-datastore';
import {ResourceId} from '../constants';
import {PLACEHOLDER} from '../images/row/image-row';
import {Query} from '../datastore/model/query';
import {ImageReadDatastore} from '../datastore/field/image-read-datastore';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module TypeImagesUtil {

    /**
     * @param document: A document of category Type or TypeCatalog
     * @param datastore
     *
     * Returns images of linked categories (for type catalogs) or finds (for categories). If the categories linked to a
     * type catalog are not directly linked to an image, the images of finds linked to the categories are returned.
     */
    export function getLinkedImageIds(document: FieldDocument,
                                      fieldDatastore: FieldReadDatastore,
                                      imageDatastore: ImageReadDatastore): Promise<string[]> {

        if (document.resource.category !== 'Type' && document.resource.category !== 'TypeCatalog') {
            throw 'Illegal argument: Document must be of category Type or TypeCatalog.';
        }

        return document.resource.category === 'TypeCatalog'
            ? getLinkedImagesForTypeCatalog(document.resource.id, fieldDatastore, imageDatastore)
            : getLinkedImagesForType(document.resource.id, fieldDatastore, imageDatastore);
    }


    async function getLinkedImagesForTypeCatalog(resourceId: ResourceId, fieldDatastore: FieldReadDatastore,
                                                 imageDatastore: ImageReadDatastore): Promise<string[]> {

        const resourceIds: string[] = (await fieldDatastore.find(
            {
                constraints: { 'liesWithin:contain': resourceId },
                skipDocuments: true
            }
        )).ids;

        return asyncFlow(
            resourceIds,
            asyncMap(getTypeImage(fieldDatastore, imageDatastore)),
            filter(isDefined));
    }


    function getTypeImage(fieldDatastore: FieldReadDatastore, imageDatastore: ImageReadDatastore) {

        return async (resourceId: string): Promise<string|undefined> => {

            let imageId: string|undefined = await getMainImageId(resourceId, imageDatastore);

            if (imageId) {
                return imageId;
            } else {
                const linkedImageIds: string[] = await getLinkedImagesForType(resourceId, fieldDatastore, imageDatastore);

                return linkedImageIds.length > 0
                    ? linkedImageIds[0]
                    : undefined;
            }
        }
    }


    async function getLinkedImagesForType(resourceId: ResourceId, fieldDatastore: FieldReadDatastore,
                                          imageDatastore: ImageReadDatastore): Promise<string[]> {

        const query: Query = {
            constraints: { 'isInstanceOf:contain': resourceId },
            skipDocuments: true
        };

        const ids: string[] = (await fieldDatastore.find(query)).ids;

        const result: string[] = [];

        for (let id of ids) {
            const imageId: string|undefined = await getMainImageId(id, imageDatastore);
            result.push(imageId ? imageId : PLACEHOLDER);
        }

        return result;
    }


    async function getMainImageId(resourceId: string, imageDatastore: ImageReadDatastore): Promise<string|undefined> {

        const query: Query = {
            constraints: { 'isDepictedIn:links': resourceId },
            sort: { mode: 'none' },
            skipDocuments: true
        };

        const ids: string[] = (await imageDatastore.find(query)).ids;

        return ids.length > 0 ? ids[0] : undefined;
    }
}

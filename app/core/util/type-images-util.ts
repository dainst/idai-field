import {isDefined, filter} from 'tsfun';
import {map as asyncMap, flow as asyncFlow} from 'tsfun/async';
import {FieldDocument} from 'idai-components-2';
import {FieldDocumentFindResult, FieldReadDatastore} from '../datastore/field/field-read-datastore';
import {ResourceId} from '../constants';
import {ModelUtil} from '../model/model-util';
import {ImageRowItem, PLACEHOLDER} from '../../components/image/row/image-row.component';
import {Query} from 'idai-components-2/index';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module TypeImagesUtil {

    /**
     * @param document: A document of resource type Type or TypeCatalog
     * @param datastore
     *
     * Returns images of linked types (for type catalogs) or finds (for types). If the types linked to a
     * type catalog are not directly linked to an image, the images of finds linked to the types are returned.
     */
    export function getLinkedImages(document: FieldDocument,
                                    datastore: FieldReadDatastore): Promise<Array<ImageRowItem>> {

        if (document.resource.type !== 'Type' && document.resource.type !== 'TypeCatalog') {
            throw 'Illegal argument: Document must be of resource type Type or TypeCatalog.';
        }

        const find = (q: Query) => datastore.find(q);

        return document.resource.type === 'TypeCatalog'
            ? getLinkedImagesForTypeCatalog(document.resource.id, find)
            : getLinkedImagesForType(document.resource.id, find);
    }


    async function getLinkedImagesForTypeCatalog(resourceId: ResourceId,
                                                 find: (query: Query) => Promise<FieldDocumentFindResult>): Promise<Array<ImageRowItem>> {

        const documents: Array<FieldDocument> = (await find(
            { constraints: { 'liesWithin:contain': resourceId } }
        )).documents;

        return asyncFlow(
            documents,
            asyncMap(getTypeImage(find)),
            filter(isDefined)) as Promise<Array<ImageRowItem>>;
    }


    function getTypeImage(find: (query: Query) => Promise<FieldDocumentFindResult>) {

        return async (document: FieldDocument): Promise<ImageRowItem|undefined> => {

            let imageId: string|undefined = await ModelUtil.getMainImageId(document.resource);

            if (imageId) {
                return { imageId: imageId, document: document };
            } else {
                const linkedImages: Array<ImageRowItem> = await getLinkedImagesForType(
                    document.resource.id, find
                );

                return linkedImages.length > 0
                    ? linkedImages[0]
                    : undefined;
            }
        }
    }


    async function getLinkedImagesForType(resourceId: ResourceId,
                                          find: (query: Query) => Promise<FieldDocumentFindResult>): Promise<Array<ImageRowItem>> {

        const constraints = { constraints: { 'isInstanceOf:contain': resourceId }};

        return (await find(constraints))
            .documents
            .map(document => {
                const imageId: string|undefined = ModelUtil.getMainImageId(document.resource);
                return { imageId: imageId ? imageId : PLACEHOLDER, document: document };
            })
            .filter(isDefined) as Array<ImageRowItem>;
    }
}
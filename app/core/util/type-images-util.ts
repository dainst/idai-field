import {to, isDefined} from 'tsfun';
import {asyncMap} from 'tsfun-extra';
import {FieldDocument, FieldResource} from 'idai-components-2';
import {FieldReadDatastore} from '../datastore/field/field-read-datastore';
import {ModelUtil} from '../model/model-util';
import getMainImageId = ModelUtil.getMainImageId;
import {ResourceId} from '../constants';

const RESOURCE = 'resource';

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
    export function getIdsOfLinkedImages(document: FieldDocument,
                                         datastore: FieldReadDatastore): Promise<string[]> {

        if (document.resource.type !== 'Type' && document.resource.type !== 'TypeCatalog') {
            throw Error('Illegal argument: Document must be of resource type Type or TypeCatalog.');
        }

        return document.resource.type === 'TypeCatalog'
            ? getLinkedImageIdsForTypeCatalog(document.resource.id, datastore)
            : getLinkedImageIdsForType(document.resource.id, datastore);
    }


    async function getLinkedImageIdsForTypeCatalog(resourceId: ResourceId,
                                                   datastore: FieldReadDatastore): Promise<string[]> {

        const documents: Array<FieldDocument> = (await datastore.find(
            { constraints: { 'liesWithin:contain': resourceId } }
        )).documents;

        return (await asyncMap(
            (document: FieldDocument) => getTypeImageId(document.resource, datastore)
        )(documents)).filter(isDefined) as string[];
    }


    async function getTypeImageId(resource: FieldResource,
                                  datastore: FieldReadDatastore): Promise<string|undefined> {

        let imageId: string|undefined = await ModelUtil.getMainImageId(resource);

        if (!imageId) {
            const linkedImageIds: string[] = await getLinkedImageIdsForType(resource.id, datastore);
            if (linkedImageIds.length > 0) imageId = linkedImageIds[0];
        }

        return imageId;
    }


    async function getLinkedImageIdsForType(resourceId: ResourceId,
                                            datastore: FieldReadDatastore): Promise<string[]> {

        const constraints = { constraints: { 'isInstanceOf:contain': resourceId }};

        return (await datastore.find(constraints))
            .documents
            .map(to(RESOURCE))
            .map(getMainImageId)
            .filter(isDefined) as string[];
    }
}
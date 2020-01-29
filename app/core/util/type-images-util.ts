import {asyncMap} from 'tsfun-extra';
import {FieldDocument} from 'idai-components-2';
import {FieldReadDatastore} from '../datastore/field/field-read-datastore';
import {ModelUtil} from '../model/model-util';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module TypeImagesUtil {

    /**
     * @param document: A document of resource type Type or TypeCatalog
     *
     * Returns images of linked types (for type catalogs) or finds (for types). If the types linked to a
     * type catalog are not directly linked to an image, the images of finds linked to the types are returned.
     */
    export function getIdsOfLinkedImages(document: FieldDocument,
                                               datastore: FieldReadDatastore): Promise<string[]> {

        if (document.resource.type !== 'Type' && document.resource.type !== 'TypeCatalog') {
            throw 'Illegal argument: Document must be of resource type Type or TypeCatalog.';
        }

        return document.resource.type === 'TypeCatalog'
            ? getLinkedImageIdsForTypeCatalog(document, datastore)
            : getLinkedImageIdsForType(document, datastore);
    }


    async function getLinkedImageIdsForTypeCatalog(document: FieldDocument,
                                                   datastore: FieldReadDatastore): Promise<string[]> {

        const documents: Array<FieldDocument> = (await datastore.find(
            { constraints: { 'liesWithin:contain': document.resource.id } }
        )).documents;

        return (await asyncMap(
            (document: FieldDocument) => getTypeImageId(document, datastore)
        )(documents)).filter(id => id !== undefined) as string[];
    }


    async function getLinkedImageIdsForType(document: FieldDocument,
                                            datastore: FieldReadDatastore): Promise<string[]> {

        const documents: Array<FieldDocument> = (await datastore.find(
            { constraints: { 'isInstanceOf:contain': document.resource.id } }
        )).documents;

        return documents.map((document: FieldDocument) => ModelUtil.getMainImageId(document))
            .filter(id => id !== undefined) as string[];
    }


    async function getTypeImageId(document: FieldDocument,
                                  datastore: FieldReadDatastore): Promise<string|undefined> {

        let imageId: string|undefined = await ModelUtil.getMainImageId(document);

        if (!imageId) {
            const linkedImageIds: string[] = await getLinkedImageIdsForType(document, datastore);
            if (linkedImageIds.length > 0) imageId = linkedImageIds[0];
        }

        return imageId;
    }
}
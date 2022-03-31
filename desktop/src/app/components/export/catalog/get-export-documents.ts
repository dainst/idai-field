import { Either, subtract, to } from 'tsfun';
import { Document, Relation, Name, ON_RESOURCE_ID, Resource, RESOURCE_DOT_IDENTIFIER, toResourceId, Datastore,
    childrenOf } from 'idai-field-core';
import { ImageRelationsManager } from '../../../services/image-relations-manager';


export const ERROR_NOT_ALL_IMAGES_EXCLUSIVELY_LINKED = 'export.catalog.get-export-documents.not-all-images-exclusively-linked';


export async function getExportDocuments(datastore: Datastore,
                                         imageRelationsManager: ImageRelationsManager,
                                         typeCatalogId: Resource.Id,
                                         project: Name)
    : Promise<Either<string[] /* msgWithParams */, [Array<Document>, Array<Resource.Id>]>> {

    const catalogAndTypes = await getCatalogAndTypes(typeCatalogId, datastore);
    const linkedImages = (await imageRelationsManager.getLinkedImages(catalogAndTypes)).map(Document.clone);
    const exclusivelyLinkedImages = await imageRelationsManager.getLinkedImages(catalogAndTypes, true);

    if (linkedImages.length !== exclusivelyLinkedImages.length) {

        const diff = subtract(ON_RESOURCE_ID, exclusivelyLinkedImages)(linkedImages);
        const diffImageIds = diff.map(to(RESOURCE_DOT_IDENTIFIER));

        return [
            [ERROR_NOT_ALL_IMAGES_EXCLUSIVELY_LINKED, diffImageIds.join(',')],
            undefined
        ];
    }

    const relatedImages = cleanImageDocuments(linkedImages);
    return [
        undefined,
        [
            catalogAndTypes
                .concat(relatedImages)
                .map(cleanDocument)
                .map(document => {
                    document.project = project;
                    return document;
                }),
            relatedImages.map(toResourceId)
        ]
    ];
}


async function getCatalogAndTypes(typeCatalogId: Resource.Id, datastore: Datastore): Promise<Array<Document>> {

    const catalog: Document = await datastore.get(typeCatalogId);
    const types: Array<Document> = (await datastore.find(childrenOf(typeCatalogId))).documents;
    return [catalog].concat(types).map(Document.clone);
}


function cleanImageDocuments(images: Array<Document>) {

    const relatedImageDocuments = [];
    for (let image of images) {
        image.resource.relations = {
            depicts: image.resource.relations[Relation.Image.DEPICTS] // we know it depicts only catalog exclusive resources
        } as any;
        relatedImageDocuments.push(image);
    }
    return relatedImageDocuments;
}


function cleanDocument(document: Document) {

    delete document['_attachments'];
    delete document[Document._REV];
    delete document['_id'];
    delete document[Document.CREATED];
    delete document[Document.MODIFIED];
    delete document.resource.relations[Relation.Type.HASINSTANCE];
    delete document.resource.relations[Relation.Hierarchy.RECORDEDIN];
    return document;
}

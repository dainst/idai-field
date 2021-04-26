import { Document, Relations, Name, ON_RESOURCE_ID, ResourceId, RESOURCE_DOT_IDENTIFIER, toResourceId } from 'idai-field-core';
import { Either, subtract, to } from 'tsfun';
import { ImageRelationsManager } from '../../model/image-relations-manager';
import { RelationsManager } from '../../model/relations-manager';


export const ERROR_NOT_ALL_IMAGES_EXCLUSIVELY_LINKED = 'export.catalog.get-export-documents.not-all-images-exclusively-linked';


export async function getExportDocuments(relationsManager: RelationsManager,
                                         imageRelationsManager: ImageRelationsManager,
                                         catalogId: ResourceId,
                                         project: Name)
    : Promise<Either<string[] /* msgWithParams */, [Array<Document>, Array<ResourceId>]>> {

    const catalogAndTypes = (await relationsManager.get(catalogId, { descendants: true })).map(Document.clone);

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


function cleanImageDocuments(images: Array<Document>) {

    const relatedImageDocuments = [];
    for (let image of images) {
        image.resource.relations = {
            depicts: image.resource.relations[Relations.Image.DEPICTS] // we know it depicts only catalog exclusive resources
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
    delete document.resource.relations[Relations.Type.HASINSTANCE];
    delete document.resource.relations[Relations.Hierarchy.RECORDEDIN];
    return document;
}

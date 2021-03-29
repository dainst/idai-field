import {Either, subtract, to} from 'tsfun';
import {Document, toResourceId} from 'idai-components-2';
import {DocumentReadDatastore} from '../../datastore/document-read-datastore';
import {Name, RESOURCE_DOT_IDENTIFIER, ResourceId, ON_RESOURCE_ID} from '../../constants';
import {HierarchicalRelations, ImageRelationsC as ImageRelations, TypeRelations, clone} from '@idai-field/core';
import {RelationsManager} from '../../model/relations-manager';
import {ImageRelationsManager} from '../../model/image-relations-manager';


export const ERROR_NOT_ALL_IMAGES_EXCLUSIVELY_LINKED = 'export.catalog.get-export-documents.not-all-images-exclusively-linked';


export async function getExportDocuments(datastore: DocumentReadDatastore, /*TODO unused*/
                                         relationsManager: RelationsManager,
                                         imageRelationsManager: ImageRelationsManager,
                                         catalogId: ResourceId,
                                         project: Name)
    : Promise<Either<string[] /* msgWithParams */, [Array<Document>, Array<ResourceId>]>> {

    const catalogAndTypes = clone(await relationsManager.get(catalogId, { descendants: true }));

    const linkedImages = clone(await imageRelationsManager.getLinkedImages(catalogAndTypes));
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
            depicts: image.resource.relations[ImageRelations.DEPICTS] // we know it depicts only catalog exclusive resources
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
    delete document.resource.relations[TypeRelations.HASINSTANCE];
    delete document.resource.relations[HierarchicalRelations.RECORDEDIN];
    return document;
}

import {DocumentReadDatastore} from '../../datastore/document-read-datastore';
import {Document, toResourceId} from 'idai-components-2';
import {Name, ResourceId} from '../../constants';
import {flatten, includedIn, isDefined} from 'tsfun';
import {map as asyncMap} from 'tsfun/async';
import {clone} from 'tsfun/struct';
import {Query} from '../../datastore/model/query';
import {ImageRelations} from '../../model/relation-constants';


export async function getExportDocuments(datastore: DocumentReadDatastore,
                                         catalogId: ResourceId,
                                         project: Name): Promise<[Array<Document>, Array<ResourceId>]> {

    const catalogAndTypes = await getCatalogAndTypes(datastore, catalogId);
    const relatedImages = await getImages(datastore, catalogAndTypes);
    return [
        catalogAndTypes
            .concat(relatedImages)
            .map(cleanDocument)
            .map(document => {
                document.project = project;
                return document;
            }),
        relatedImages.map(toResourceId)
    ];
}


function cleanImageDocuments(images: Array<Document>, idsOfCatalogResources: Array<ResourceId>) {

    const relatedImageDocuments = [];
    for (let image of images) {

        image.resource.relations = {
            depicts: image.resource.relations[ImageRelations.DEPICTS]
                .filter(includedIn(idsOfCatalogResources))
        } as any;

        if (image.resource.relations[ImageRelations.DEPICTS].length > 0) {
            relatedImageDocuments.push(image);
        }
    }
    return relatedImageDocuments;
}


async function getImages(datastore: DocumentReadDatastore,
                         catalogAndTypes: Array<Document>): Promise<Array<Document>> {

    const idsOfRelatedDocuments = flatten(
        catalogAndTypes
            .map(document => document.resource.relations[ImageRelations.ISDEPICTEDIN])
            .filter(isDefined));

    return cleanImageDocuments(await asyncMap(idsOfRelatedDocuments, async id => {
        // TODO handle error
        return clone(await datastore.get(id));
    }), catalogAndTypes.map(toResourceId));
}


async function getCatalogAndTypes(datastore: DocumentReadDatastore,
                                  catalogId: ResourceId): Promise<Array<Document>> {

    const typeCatalog = await datastore.get(catalogId);
    const typesQuery: Query = {
        constraints: {
            'liesWithin:contain': {
                value: catalogId,
                searchRecursively: true
            }
        }
    };
    const types = (await datastore.find(typesQuery)).documents; // TODO handle errors
    return [typeCatalog].concat(types);
}


function cleanDocument(document: Document) {

    delete document['_attachments'];
    delete document[Document._REV];
    delete document[Document.CREATED];
    delete document[Document.MODIFIED];
    // TODO delete all relations execpt isDepictedIn and depicts
    return document;
}

import {DocumentReadDatastore} from '../datastore/document-read-datastore';
import {ResourceId} from '../constants';
import {Document, FieldDocument} from 'idai-components-2';
import {Query} from '../datastore/model/query';
import {flatten, isDefined} from 'tsfun';
import {ImageRelations} from './relation-constants';
import {map as asyncMap} from 'tsfun/async';
import {clone} from 'tsfun/struct';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Imagestore} from '../images/imagestore/imagestore';
import {PersistenceManager} from './persistence-manager';


export module CatalogUtil {

    export async function getCatalogAndTypes(datastore: DocumentReadDatastore,
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


    export async function getCatalogImages(datastore: DocumentReadDatastore,
                                           catalogAndTypes: Array<Document>): Promise<Array<Document>> {

        const idsOfRelatedDocuments = flatten(
            catalogAndTypes
                .map(document => document.resource.relations[ImageRelations.ISDEPICTEDIN])
                .filter(isDefined));

        return await asyncMap(idsOfRelatedDocuments, async id => {
            // TODO handle error
            return clone(await datastore.get(id));
        });
    }


    // TODO we could double check that all documents have document.project
    export async function deleteCatalogWithImages(persistenceManager: PersistenceManager,
                                                  datastore: DocumentDatastore,
                                                  imagestore: Imagestore,
                                                  username: string,
                                                  document: FieldDocument // TODO pass id instead document
    ) {

        const catalogAndTypes =
            await getCatalogAndTypes(datastore, document.resource.id);

        await persistenceManager.remove(document, username);

        const catalogImages =
            await getCatalogImages(datastore, catalogAndTypes);

        if (imagestore.getPath() === undefined) {
            console.error("imagestore path not set, cannot delete documents");
        } else {
            for (let catalogImage of catalogImages) {
                try {
                    await imagestore.remove(catalogImage.resource.id);
                    await datastore.remove(catalogImage);
                } catch (err) {
                    console.error("could not delete image", err);
                }
            }
        }
    }
}

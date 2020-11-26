import {DocumentReadDatastore} from '../datastore/document-read-datastore';
import {ResourceId} from '../constants';
import {Document, toResourceId} from 'idai-components-2';
import {Query} from '../datastore/model/query';
import {flatten, isDefined} from 'tsfun';
import {ImageRelations} from './relation-constants';
import {map as asyncMap} from 'tsfun/async';
import {clone} from 'tsfun/struct';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Imagestore} from '../images/imagestore/imagestore';
import {PersistenceManager} from './persistence-manager';
import {CategoryConstants} from './category-constants';


// TODO handle errors in all functions
export module CatalogUtil {

    import TYPE_CATALOG = CategoryConstants.TYPE_CATALOG;
    import TYPE = CategoryConstants.TYPE;

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
        const types = (await datastore.find(typesQuery)).documents;
        return [typeCatalog].concat(types);
    }


    export async function getCatalogImages(datastore: DocumentReadDatastore,
                                           catalogAndTypes: Array<Document>): Promise<Array<Document>> {

        const idsOfRelatedDocuments = flatten(
            catalogAndTypes
                .map(document => document.resource.relations[ImageRelations.ISDEPICTEDIN])
                .filter(isDefined));

        return await asyncMap(idsOfRelatedDocuments, async id => {
            return clone(await datastore.get(id));
        });
    }


    export async function deleteCatalogWithImages(persistenceManager: PersistenceManager,
                                                  datastore: DocumentDatastore,
                                                  imagestore: Imagestore,
                                                  username: string,
                                                  document: Document,
                                                  skipImageDeletion = false) {

        if (document.resource.category !== TYPE_CATALOG
            && document.resource.category !== TYPE) throw 'illegal argument - document must be either Type or TypeCatalog';

        if (skipImageDeletion) {
            await persistenceManager.remove(document);
            return;
        }

        const catalogAndTypes =
            await getCatalogAndTypes(datastore, document.resource.id);

        const catalogAndTypesIds = catalogAndTypes.map(toResourceId);
        const catalogImages =
            (await getCatalogImages(datastore, catalogAndTypes))
                .filter(catalogImage => {
                    for (let c of catalogImage.resource.relations.depicts) {
                        if (!catalogAndTypesIds.includes(c)) return false;
                    }
                    return true;
                });
        if (catalogImages.length > 0
            && imagestore.getPath() === undefined) throw 'illegal state - imagestore.getPath() must not return undefined';


        for (let doc of catalogAndTypes) await datastore.remove(doc);

        for (let catalogImage of catalogImages) {
            await imagestore.remove(catalogImage.resource.id);
            await datastore.remove(catalogImage);
        }
    }
}

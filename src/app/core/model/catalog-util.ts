import {Document} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Imagestore} from '../images/imagestore/imagestore';
import {PersistenceManager} from './persistence-manager';
import {CategoryConstants} from './category-constants';


// TODO handle errors
export module CatalogUtil {

    import TYPE_CATALOG = CategoryConstants.TYPE_CATALOG;
    import TYPE = CategoryConstants.TYPE;


    // TODO generalize to other document types
    export async function remove(persistenceManager: PersistenceManager,
                                 datastore: DocumentDatastore,
                                 imagestore: Imagestore,
                                 username: string,
                                 typeOrTypeCatalogDocument: Document,
                                 skipImageDeletion = false) {

        if (typeOrTypeCatalogDocument.resource.category !== TYPE_CATALOG
            && typeOrTypeCatalogDocument.resource.category !== TYPE) {
            throw 'illegal argument - document must be either Type or TypeCatalog';
        }
        if (skipImageDeletion) {
            await persistenceManager.remove(typeOrTypeCatalogDocument);
            return;
        }

        const catalogImages = (await persistenceManager.remove(typeOrTypeCatalogDocument) as any);
        if (catalogImages.length > 0
            && imagestore.getPath() === undefined) throw 'illegal state - imagestore.getPath() must not return undefined';

        for (let catalogImage of catalogImages) {
            await imagestore.remove(catalogImage.resource.id);
            await datastore.remove(catalogImage);
        }
    }
}

import {Document} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Imagestore} from '../images/imagestore/imagestore';
import {RelationsManager} from './relations-manager';
import {CategoryConstants} from './category-constants';


// TODO handle errors
export module RemovalUtil {

    import TYPE_CATALOG = CategoryConstants.TYPE_CATALOG;
    import TYPE = CategoryConstants.TYPE;


    // TODO generalize to other document types
    export async function remove(relationsManager: RelationsManager,
                                 datastore: DocumentDatastore,
                                 imagestore: Imagestore,
                                 username: string,
                                 document: Document,
                                 skipImageDeletion = false) {

        // TODO replace this with checking for document not being an image category document
        if (document.resource.category !== TYPE_CATALOG
            && document.resource.category !== TYPE) {
            throw 'illegal argument - document must be either Type or TypeCatalog';
        }
        if (skipImageDeletion) {
            await relationsManager.remove(document);
            return;
        }

        const catalogImages = (await relationsManager.remove(document) as any);
        if (catalogImages.length > 0
            && imagestore.getPath() === undefined) throw 'illegal state - imagestore.getPath() must not return undefined';

        for (let catalogImage of catalogImages) {
            await imagestore.remove(catalogImage.resource.id);
            await datastore.remove(catalogImage);
        }
    }
}

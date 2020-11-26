import {Document, toResourceId} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Imagestore} from '../images/imagestore/imagestore';
import {RelationsManager} from './relations-manager';
import {CategoryConstants} from './category-constants';
import {ImageRelations} from './relation-constants';
import {flatten, includedIn, isDefined, isNot} from 'tsfun';
import {map as asyncMap} from 'tsfun/async';
import {DocumentReadDatastore} from '../datastore/document-read-datastore';


// TODO handle errors
// TODO convert to class and provide projectConfiguration to get category tree to get image categorie names
export module ImageRelationsManager {

    import TYPE_CATALOG = CategoryConstants.TYPE_CATALOG;
    import TYPE = CategoryConstants.TYPE;

    import DEPICTS = ImageRelations.DEPICTS;
    import ISDEPICTEDIN = ImageRelations.ISDEPICTEDIN;


    export async function getRelatedImageDocuments(datastore: DocumentReadDatastore,
                                                   documents: Array<Document>): Promise<Array<Document>> {

        const documentsIds = documents.map(toResourceId);
        const idsOfRelatedDocuments = flatten(
            documents
                .map(document => document.resource.relations[ISDEPICTEDIN])
                .filter(isDefined))
            .filter(isNot(includedIn(documentsIds)));

        return await asyncMap(idsOfRelatedDocuments, async id => {
            return await datastore.get(id as any);
        });
    }


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

        // TODO deduplicate the following line with the first one in relationsManager.remove
        const documentsToBeDeleted = (await relationsManager.fetchChildren(document)).concat([document]);
        await relationsManager.remove(document);

        const catalogImages = await getLeftovers(datastore, documentsToBeDeleted);
        if (catalogImages.length > 0
            && imagestore.getPath() === undefined) throw 'illegal state - imagestore.getPath() must not return undefined';

        for (let catalogImage of catalogImages) {
            await imagestore.remove(catalogImage.resource.id);
            await datastore.remove(catalogImage);
        }
    }


    async function getLeftovers(datastore: DocumentReadDatastore, documentsToBeDeleted: Array<Document>) {

        const idsOfDocumentsToBeDeleted = documentsToBeDeleted.map(toResourceId);

        const leftovers = [];
        for (let imageDocument of (await getRelatedImageDocuments(datastore, documentsToBeDeleted))) {
            let depictsOnlyDocumentsToBeDeleted = true;
            for (let depictsTargetId of imageDocument.resource.relations[DEPICTS]) {
                if (!idsOfDocumentsToBeDeleted.includes(depictsTargetId)) depictsOnlyDocumentsToBeDeleted = false;
            }
            if (depictsOnlyDocumentsToBeDeleted) leftovers.push(imageDocument);
        }
        return leftovers;
    }
}

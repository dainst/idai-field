import {Document, toResourceId} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Imagestore} from '../images/imagestore/imagestore';
import {RelationsManager} from './relations-manager';
import {CategoryConstants} from './category-constants';
import {ImageRelations} from './relation-constants';
import {flatten, includedIn, isDefined, isNot} from 'tsfun';
import {map as asyncMap} from 'tsfun/async';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {TreeList} from '../util/tree-list';
import {Category} from '../configuration/model/category';

import TYPE_CATALOG = CategoryConstants.TYPE_CATALOG;
import TYPE = CategoryConstants.TYPE;

import DEPICTS = ImageRelations.DEPICTS;
import ISDEPICTEDIN = ImageRelations.ISDEPICTEDIN;
import {Injectable} from '@angular/core';


@Injectable()
// TODO handle errors
export class ImageRelationsManager {

    private categoryTreelist: TreeList<Category>

    constructor(private datastore: DocumentDatastore,
                private relationsManager: RelationsManager,
                private imagestore: Imagestore,
                projectConfiguration: ProjectConfiguration) {

        this.categoryTreelist = projectConfiguration.getCategoryTreelist();
    }

    public async getRelatedImageDocuments(documents: Array<Document>): Promise<Array<Document>> {

        const documentsIds = documents.map(toResourceId);
        const idsOfRelatedDocuments = flatten(
            documents
                .map(document => document.resource.relations[ISDEPICTEDIN])
                .filter(isDefined))
            .filter(isNot(includedIn(documentsIds)));

        return await asyncMap(idsOfRelatedDocuments, async id => {
            return await this.datastore.get(id as any);
        });
    }


    // TODO generalize to other document types
    public async remove(username: string, // TODO get from settings
                        document: Document,
                        skipImageDeletion = false) {

        // TODO replace this with checking for document not being an image category document
        if (document.resource.category !== TYPE_CATALOG
            && document.resource.category !== TYPE) {
            throw 'illegal argument - document must be either Type or TypeCatalog';
        }
        if (skipImageDeletion) {
            await this.relationsManager.remove(document);
            return;
        }

        // TODO deduplicate the following line with the first one in relationsManager.remove
        const documentsToBeDeleted = (await this.relationsManager.fetchChildren(document)).concat([document]);
        await this.relationsManager.remove(document);

        const catalogImages = await this.getLeftovers(documentsToBeDeleted);
        if (catalogImages.length > 0
            && this.imagestore.getPath() === undefined) throw 'illegal state - imagestore.getPath() must not return undefined';

        for (let catalogImage of catalogImages) {
            await this.imagestore.remove(catalogImage.resource.id);
            await this.datastore.remove(catalogImage);
        }
    }


    private async getLeftovers(documentsToBeDeleted: Array<Document>) {

        const idsOfDocumentsToBeDeleted = documentsToBeDeleted.map(toResourceId);

        const leftovers = [];
        for (let imageDocument of (await this.getRelatedImageDocuments(documentsToBeDeleted))) {
            let depictsOnlyDocumentsToBeDeleted = true;
            for (let depictsTargetId of imageDocument.resource.relations[DEPICTS]) {
                if (!idsOfDocumentsToBeDeleted.includes(depictsTargetId)) depictsOnlyDocumentsToBeDeleted = false;
            }
            if (depictsOnlyDocumentsToBeDeleted) leftovers.push(imageDocument);
        }
        return leftovers;
    }
}

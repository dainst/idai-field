import {Document, Resource, toResourceId} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Imagestore} from '../images/imagestore/imagestore';
import {RelationsManager} from './relations-manager';
import {ImageRelations} from './relation-constants';
import {flatten, includedIn, isDefined, isNot, on, sameset, set} from 'tsfun';
import {map as asyncMap} from 'tsfun/async';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {TreeList} from '../util/tree-list';
import {Category} from '../configuration/model/category';

import DEPICTS = ImageRelations.DEPICTS;
import ISDEPICTEDIN = ImageRelations.ISDEPICTEDIN;
import {Injectable} from '@angular/core';
import {ProjectCategories} from '../configuration/project-categories';
import {ResourceId} from '../constants';


@Injectable()
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
        const idsOfRelatedDocuments: Array<ResourceId> = flatten(
            documents
                .map(_ => _.resource.relations[ISDEPICTEDIN])
                .filter(isDefined))
            .filter(isNot(includedIn(documentsIds)));

        return await asyncMap(idsOfRelatedDocuments, async id => {
            return await this.datastore.get(id);
        });
    }


    public async remove(document: Document) {

        if (ProjectCategories.getImageCategoryNames(this.categoryTreelist)
            .includes(document.resource.category)) {
            throw 'illegal argument - document must not be of an Image category';
        }
        if (this.imagestore.getPath() === undefined) {
            throw 'illegal state - imagestore.getPath() must not return undefined';
        }

        const documentsToBeDeleted =
            (await this.relationsManager.fetchChildren(document)).concat([document]);
        await this.relationsManager.remove(document);

        const catalogImages = set(on([Document.RESOURCE, Resource.ID]), await this.getLeftovers(documentsToBeDeleted));

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

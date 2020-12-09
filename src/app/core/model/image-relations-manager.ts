import {Injectable} from '@angular/core';
import {flatten, includedIn, isDefined, isNot, on, separate, set, subtract} from 'tsfun';
import {Document, FieldDocument, ImageDocument, toResourceId} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Imagestore} from '../images/imagestore/imagestore';
import {RelationsManager} from './relations-manager';
import {ImageRelations} from './relation-constants';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {TreeList} from '../util/tree-list';
import {Category} from '../configuration/model/category';
import DEPICTS = ImageRelations.DEPICTS;
import ISDEPICTEDIN = ImageRelations.ISDEPICTEDIN;
import {ProjectCategories} from '../configuration/project-categories';
import {RESOURCE_ID_PATH, ResourceId} from '../constants';
import {clone} from '../util/object-util';


@Injectable()
export class ImageRelationsManager {

    // TODO review
    public static IMAGESTORE_ERROR_INVALID_PATH_DELETE = 'persistenceHelper/errors/imagestoreInvalidPathDelete';
    public static IMAGESTORE_ERROR_DELETE = 'persistenceHelper/errors/imagestoreErrorDelete';

    private categoryTreelist: TreeList<Category>;


    constructor(private datastore: DocumentDatastore,
                private relationsManager: RelationsManager,
                private imagestore: Imagestore,
                projectConfiguration: ProjectConfiguration) {

        this.categoryTreelist = projectConfiguration.getCategoryTreelist();
    }


    public async getRelatedImageDocuments(documents: Array<Document>,
                                          onlyExclusivelyRelated: boolean = false): Promise<Array<Document>> {

        const documentsIds = documents.map(toResourceId);
        const idsOfRelatedDocuments: Array<ResourceId> = set(flatten(
            documents
                .map(_ => _.resource.relations[ISDEPICTEDIN])
                .filter(isDefined))
            .filter(isNot(includedIn(documentsIds))));

        const result: Array<Document> = await this.datastore.getMultiple(idsOfRelatedDocuments);

        return onlyExclusivelyRelated
            ? result.filter(imageDocument => {
                return subtract(documentsIds)(imageDocument.resource.relations[DEPICTS]).length === 0;
            })
            : result;
    }


    // TODO implement; analogous to relationsManager.get(), but this time, it also returns all connected image documents
    // public async get(id: ResourceId): Promise<Array<Document>> {
    //
    // }


    /**
     * Removes image and non image documents.
     *
     * Where it removes non image documents, it removes them together with their descendants, and
     * all their (and their descendants) connected images.
     *
     * Images which are not only related to the documents to be deleted, but
     * also to other documents, are not deleted (except they are specifically amongst those given as a param).
     *
     * // TODO review
     * @throws [PersistenceHelperErrors.IMAGESTORE_ERROR_INVALID_PATH_DELETE]
     * @throws [PersistenceHelperErrors.IMAGESTORE_ERROR_DELETE]
     *
     * @param documents_
     */
    public async remove(...documents_: Array<Document|ImageDocument>) {

        if (this.imagestore.getPath() === undefined) {
            throw 'illegal state - imagestore.getPath() must not return undefined';
        }
        const [imageDocuments, documents] = separate(documents_,
                document => ProjectCategories.getImageCategoryNames(this.categoryTreelist).includes(document.resource.category));
        await this.removeImages(imageDocuments as any);

        const documentsToBeDeleted = [];
        for (const document of documents) {
            const docsInclDescendants =
                (await this.relationsManager.get(document.resource.id, { descendants: true, toplevel: false })).concat([document]);
            documentsToBeDeleted.push(...docsInclDescendants);
            await this.relationsManager.remove(document);
        }

        const imagesToBeDeleted = set(on(RESOURCE_ID_PATH), await this.getLeftovers(documentsToBeDeleted));
        for (let image of imagesToBeDeleted) {
            await this.imagestore.remove(image.resource.id);
            await this.datastore.remove(image);
        }
    }


    public async addDepictsRelations(targetDocument: FieldDocument, ...selectedImages: Array<ImageDocument>) {

        for (let imageDocument of selectedImages) {
            const oldVersion: ImageDocument = clone(imageDocument);
            const depictsRelations: string[] = imageDocument.resource.relations.depicts;

            if (depictsRelations.indexOf(targetDocument.resource.id) === -1) {
                depictsRelations.push(targetDocument.resource.id);
            }

            await this.relationsManager.update(
                imageDocument, oldVersion
            );
        }
    }


    public async removeDepictsRelations(...selectedImages: Array<ImageDocument>) {

        for (let document of selectedImages) {
            const oldVersion: ImageDocument = clone(document);
            document.resource.relations.depicts = [];

            await this.relationsManager.update(
                document, oldVersion
            );
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


    private async removeImages(imageDocuments: Array<ImageDocument>) {

        if (!this.imagestore.getPath()) throw [ImageRelationsManager.IMAGESTORE_ERROR_INVALID_PATH_DELETE];

        for (let imageDocument of imageDocuments) {
            if (!imageDocument.resource.id) continue;
            const resourceId: string = imageDocument.resource.id;

            try {
                await this.imagestore.remove(resourceId);
            } catch (err) {
                throw [ImageRelationsManager.IMAGESTORE_ERROR_DELETE, imageDocument.resource.identifier];
            }

            await this.relationsManager.remove(imageDocument);
        }
    }
}

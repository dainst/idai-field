import { Injectable } from '@angular/core';
import { Category, Document, Datastore, FieldDocument, ImageDocument, Relations, ObjectUtils, ON_RESOURCE_ID, ResourceId, toResourceId, Forest } from 'idai-field-core';
import { flatten, includedIn, isDefined, isNot, on, separate, set, subtract, to } from 'tsfun';
import { ProjectCategories } from '../configuration/project-categories';
import { ProjectConfiguration } from '../configuration/project-configuration';
import { Imagestore } from '../images/imagestore/imagestore';
import { RelationsManager } from './relations-manager';
import DEPICTS = Relations.Image.DEPICTS;
import ISDEPICTEDIN = Relations.Image.ISDEPICTEDIN;


export module ImageRelationsManagerErrors {

    export const IMAGESTORE_ERROR_INVALID_PATH_DELETE = 'imageRelationsManagerErrors/imagestoreInvalidPathDelete';
    export const IMAGESTORE_ERROR_DELETE = 'imageRelationsManagerErrors/imagestoreErrorDelete';
}


@Injectable()
export class ImageRelationsManager {

    private categoryForest: Forest<Category>;

    constructor(private datastore: Datastore,
                private relationsManager: RelationsManager,
                private imagestore: Imagestore,
                projectConfiguration: ProjectConfiguration) {

        this.categoryForest = projectConfiguration.getCategoryForest();
    }


    public async getLinkedImages(documents: Array<Document>,
                                 onlyExclusivelyRelated: boolean = false): Promise<Array<Document>> {

        const documentsIds = documents.map(toResourceId);
        const idsOfRelatedDocuments: Array<ResourceId> = set(flatten(
            documents
                .map(_ => _.resource.relations[ISDEPICTEDIN])
                .filter(isDefined))
            .filter(isNot(includedIn(documentsIds))));

        const result = (await this.datastore.getMultiple(idsOfRelatedDocuments));

        return onlyExclusivelyRelated
            ? result.filter(imageDocument => {
                return subtract(documentsIds)(imageDocument.resource.relations[DEPICTS]).length === 0;
            })
            : result;
    }


    /**
     * Removes image and non image documents.
     *
     * Where it removes non image documents, it removes them together with their descendants, and
     * all their (and their descendants) connected images.
     *
     * Images which are not only related to the documents to be deleted, but
     * also to other documents, are not deleted (except they are specifically amongst those given as a param).
     *
     * @throws [ImageRelationsManagerErrors.IMAGESTORE_ERROR_INVALID_PATH_DELETE]
     * @throws [ImageRelationsManagerErrors.IMAGESTORE_ERROR_DELETE]
     *
     * @param documents
     */
    public async remove(...documents: Array<Document|ImageDocument>) {

        if (this.imagestore.getPath() === undefined) {
            throw [ImageRelationsManagerErrors.IMAGESTORE_ERROR_INVALID_PATH_DELETE];
        }
        const [imageDocuments, nonImageDocuments] = separate(documents,
                document => ProjectCategories.getImageCategoryNames(this.categoryForest).includes(document.resource.category));
        await this.removeImages(imageDocuments as any);

        const documentsToBeDeleted = [];
        for (const document of nonImageDocuments) {
            const docsInclDescendants =
                (await this.relationsManager.get(document.resource.id, { descendants: true, toplevel: false })).concat([document]);
            documentsToBeDeleted.push(...docsInclDescendants);
            await this.relationsManager.remove(document, { descendants: true });
        }

        const imagesToBeDeleted = set(ON_RESOURCE_ID, await this.getLeftovers(documentsToBeDeleted));
        for (let image of imagesToBeDeleted) {
            await this.imagestore.remove(image.resource.id);
            await this.datastore.remove(image);
        }
    }


    public async link(targetDocument: FieldDocument, ...selectedImages: Array<ImageDocument>) {

        const projects = set(on(Document.PROJECT), [targetDocument].concat(selectedImages as any))
            .map(to(Document.PROJECT));
        if (projects.length !== 1) throw 'illegal argument - link will only operate on owned documents';
        if (projects[0] !== undefined) throw 'illegal argument - link will only operate on owned documents';

        for (let imageDocument of selectedImages) {
            const oldVersion = Document.clone(imageDocument);
            const depictsRelations: string[] = imageDocument.resource.relations.depicts;

            if (depictsRelations.indexOf(targetDocument.resource.id) === -1) {
                depictsRelations.push(targetDocument.resource.id);
            }

            await this.relationsManager.update(
                imageDocument, oldVersion
            );
        }
    }


    public async unlink(...selectedImages: Array<ImageDocument>) {

        for (let document of selectedImages) {
            const oldVersion = Document.clone(document);
            document.resource.relations.depicts = [];

            await this.relationsManager.update(
                document, oldVersion
            );
        }
    }


    private async getLeftovers(documentsToBeDeleted: Array<Document>) {

        const idsOfDocumentsToBeDeleted = documentsToBeDeleted.map(toResourceId);

        const leftovers = [];
        for (let imageDocument of (await this.getLinkedImages(documentsToBeDeleted))) {
            let depictsOnlyDocumentsToBeDeleted = true;
            for (let depictsTargetId of imageDocument.resource.relations[DEPICTS]) {
                if (!idsOfDocumentsToBeDeleted.includes(depictsTargetId)) depictsOnlyDocumentsToBeDeleted = false;
            }
            if (depictsOnlyDocumentsToBeDeleted) leftovers.push(imageDocument);
        }
        return leftovers;
    }


    private async removeImages(imageDocuments: Array<ImageDocument>) {

        for (let imageDocument of imageDocuments) {
            if (!imageDocument.resource.id) continue;
            const resourceId: string = imageDocument.resource.id;
            try {
                await this.imagestore.remove(resourceId);
            } catch (err) {
                throw [ImageRelationsManagerErrors.IMAGESTORE_ERROR_DELETE, imageDocument.resource.identifier];
            }
            await this.relationsManager.remove(imageDocument);
        }
    }
}

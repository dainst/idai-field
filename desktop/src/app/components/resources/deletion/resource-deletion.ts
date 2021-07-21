import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { flow, size, subtract } from 'tsfun';
import { childrenOf, Datastore, FieldDocument, Named, ProjectConfiguration, RelationsManager, toResourceId } from 'idai-field-core';
import { DeleteModalComponent } from './delete-modal.component';
import { DeletionInProgressModalComponent } from './deletion-in-progress-modal.component';
import { ImageRelationsManager } from '../../../core/services/image-relations-manager';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class ResourceDeletion {

    constructor(private modalService: NgbModal,
                private datastore: Datastore,
                private relationsManager: RelationsManager,
                private imageRelationsManager: ImageRelationsManager,
                private projectConfiguration: ProjectConfiguration) {}


    public async delete(documents: Array<FieldDocument>) {

        const descendantsCount = this.getDescendantsCount(documents);

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteModalComponent, { keyboard: false }
        );
        modalRef.componentInstance.documents = documents;
        modalRef.componentInstance.descendantsCount = descendantsCount;

        const documentsAndDescendants: Array<FieldDocument>
            = (await this.getDescendants(documents)).concat(documents);
        modalRef.componentInstance.relatedImagesCount
            = (await this.imageRelationsManager.getLinkedImages(documentsAndDescendants, true)).length;

        const deleteRelatedImages: boolean = await modalRef.result;
        const deletionInProgressModalRef: NgbModalRef = this.modalService.open(
            DeletionInProgressModalComponent, { backdrop: 'static', keyboard: false }
        );
        deletionInProgressModalRef.componentInstance.multiple = documents.length + descendantsCount > 1;

        await this.performDeletion(documents, deleteRelatedImages);
        deletionInProgressModalRef.close();
    }


    private getDescendantsCount(selectedDocuments: Array<FieldDocument>): number {

        const ids = [];
        for (const document of selectedDocuments) {
            ids.push(...this.datastore.findIds(childrenOf(document.resource.id)).ids);
        }
        const documentsIds = selectedDocuments.map(toResourceId);
        return flow(ids,
            subtract(documentsIds), // selected documents may appear as descendants in multiselect
            size);
    }


    private async performDeletion(documents: Array<FieldDocument>, deleteRelatedImages: boolean) {

        if (documents.find(this.isImportedCatalog) || deleteRelatedImages) {
            await this.imageRelationsManager.remove(documents);
        } else {
            for (const document of documents) {
                await this.relationsManager.remove(document,
                    { descendants: true, descendantsToKeep: documents.filter(doc => doc !== document) }
                );
           }
        }
    }


    private async getDescendants(documents: Array<FieldDocument>): Promise<Array<FieldDocument>> {

        const descendants: Array<FieldDocument> = [];
        for (let document of documents) {
            const result = await this.datastore.find(childrenOf(document.resource.id));
            descendants.push(...result.documents as Array<FieldDocument>);
        }
        return descendants;
    }


    private isImportedCatalog = (document: FieldDocument) => {

        return this.projectConfiguration.getTypeCategories().map(Named.toName).includes(document.resource.category)
            && document.project !== undefined;
    }


    // private async deleteImageWithImageStore(document: FieldDocument) {
    //
    //     if (!this.projectConfiguration.isSubcategory(document.resource.category, 'Image')) {
    //         return undefined;
    //     }
    //
    //     if (!this.imagestore.getPath()) throw [M.IMAGESTORE_ERROR_INVALID_PATH_DELETE];
    //     try {
    //         await this.imagestore.remove(document.resource.id);
    //     } catch {
    //         throw [M.IMAGESTORE_ERROR_DELETE, document.resource.id];
    //     }
    // }
    //
    //
    // private async deleteWithPersistenceManager(document: FieldDocument) {
    //
    //     try {
    //         await this.relationsManager.remove(document);
    //     } catch (removeError) {
    //         console.error('removeWithPersistenceManager', removeError);
    //         if (removeError !== DatastoreErrors.DOCUMENT_NOT_FOUND) throw [M.DOCEDIT_ERROR_DELETE];
    //     }
    // }
}

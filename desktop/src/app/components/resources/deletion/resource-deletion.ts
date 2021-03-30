import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {set, to} from 'tsfun';
import {FieldDocument} from 'idai-field-core';
import {DeleteModalComponent} from './delete-modal.component';
import {RelationsManager} from '../../../core/model/relations-manager';
import {DeletionInProgressModalComponent} from './deletion-in-progress-modal.component';
import {ImageRelationsManager} from '../../../core/model/image-relations-manager';
import {ProjectCategories} from '../../../core/configuration/project-categories';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class ResourceDeletion {

    constructor(private modalService: NgbModal,
                private relationsManager: RelationsManager,
                private imageRelationsManager: ImageRelationsManager) {}


    public async delete(documents: Array<FieldDocument>) {

        const descendantsCount: number = await this.relationsManager.getDescendantsCount(...documents);

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


    private async performDeletion(documents: Array<FieldDocument>, deleteRelatedImages: boolean) {

        for (const document of documents) {
            if (ResourceDeletion.isImportedCatalog(document) || deleteRelatedImages) {
                 await this.imageRelationsManager.remove(document);
            } else {
                 await this.relationsManager.remove(document,
                     { descendants: true, descendantsToKeep: documents.filter(doc => doc !== document) });
            }
        }
    }


    private async getDescendants(documents: Array<FieldDocument>): Promise<Array<FieldDocument>> {

        let descendants: Array<FieldDocument> = [];

        for (let document of documents) {
            descendants = descendants.concat(
                await this.relationsManager.get(
                    document.resource.id, { descendants: true, toplevel: false }
                ) as Array<FieldDocument>
            );
        }

        return (set(descendants))
            .filter(document => !documents.map(to(['resource','id'])).includes(document.resource.id));
    }


    private static isImportedCatalog(document: FieldDocument) {

        return ProjectCategories.getTypeCategoryNames().includes(document.resource.category)
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

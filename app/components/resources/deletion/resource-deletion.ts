import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {FieldDocument, DatastoreErrors, Messages, Document} from 'idai-components-2';
import {DeleteModalComponent} from './delete-modal.component';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {TypeUtility} from '../../../core/model/type-utility';
import {UsernameProvider} from '../../../core/settings/username-provider';
import {M} from '../../messages/m';
import {DeletionInProgressModalComponent} from './deletion-in-progress-modal.component';
import {Imagestore} from '../../../core/images/imagestore/imagestore';
import {DocumentDatastore} from '../../../core/datastore/document-datastore';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class ResourceDeletion {

    constructor(private modalService: NgbModal,
                private persistenceManager: PersistenceManager,
                private imagestore: Imagestore,
                private typeUtility: TypeUtility,
                private messages: Messages,
                private usernameProvider: UsernameProvider,
                private datastore: DocumentDatastore) {}


    public async delete(document: FieldDocument) {

        const modalRef: NgbModalRef = this.modalService.open(
            DeleteModalComponent, { keyboard: false }
        );
        modalRef.componentInstance.setDocument(document);
        modalRef.componentInstance.setCount(await this.fetchChildrenCount(document));

        const decision: string = await modalRef.result;
        if (decision === 'delete') await this.performDeletion(document);
    }


    private async performDeletion(document: FieldDocument) {

        const modalRef: NgbModalRef = this.modalService.open(
            DeletionInProgressModalComponent, { backdrop: 'static', keyboard: false }
        );

        await this.deleteImageWithImageStore(document);
        await this.deleteWithPersistenceManager(document);

        modalRef.close();
    }


    private async deleteImageWithImageStore(document: FieldDocument) {

        if (!this.typeUtility.isSubtype(document.resource.type, 'Image')) return undefined;

        if (!this.imagestore.getPath()) throw [M.IMAGESTORE_ERROR_INVALID_PATH_DELETE];
        try {
            await this.imagestore.remove(document.resource.id);
        } catch (err) {
            throw [M.IMAGESTORE_ERROR_DELETE, document.resource.id];
        }
    }


    private async deleteWithPersistenceManager(document: FieldDocument) {

        try {
            await this.persistenceManager.remove(document, this.usernameProvider.getUsername())
        } catch (removeError) {
            console.error('removeWithPersistenceManager', removeError);
            if (removeError !== DatastoreErrors.DOCUMENT_NOT_FOUND) throw [M.DOCEDIT_ERROR_DELETE];
        }
    }


    private async fetchChildrenCount(document: Document): Promise<number> { // TODO move to util

        return !document.resource.id
            ? 0
            : this.typeUtility.isSubtype(document.resource.type, 'Operation')
                ? await this.findAllIsRecordedInDocs(document.resource.id)
                : await this.findAllLiesWithinDocs(document.resource.id);
    }


    private async findAllIsRecordedInDocs(resourceId: string): Promise<number> {

        return (await this.datastore.find({
            constraints: {
                'isRecordedIn:contain': resourceId
            }
        })).totalCount;
    }


    private async findAllLiesWithinDocs(resourceId: string): Promise<number> { // TODO remove duplication with persistence manager and possibly type-relation-picker-component

        return (await this.datastore.find({
            constraints: {
                'liesWithin:contain': {
                    value: resourceId,
                    type: 'add',
                    searchRecursively: true
                }
            }
        })).totalCount;
    }
}
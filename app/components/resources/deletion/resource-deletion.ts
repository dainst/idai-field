import {FieldDocument, DatastoreErrors, Messages, Document} from 'idai-components-2';
import {M} from '../../m';
import {Injectable} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DeleteModalComponent} from './delete-modal.component';
import {PersistenceManager} from '../../../core/model/persistence-manager';
import {Imagestore} from '../../../core/imagestore/imagestore';
import {TypeUtility} from '../../../core/model/type-utility';
import {UsernameProvider} from '../../../core/settings/username-provider';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';


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
                private datastore: FieldReadDatastore) {}


    public async delete(document: FieldDocument) {

        const ref: NgbModalRef = this.modalService.open(DeleteModalComponent, { keyboard: false });
        ref.componentInstance.setDocument(document);
        ref.componentInstance.setCount(await this.fetchIsRecordedInCount(document));

        try {
            const decision: string = await ref.result;
            if (decision === 'delete') await this.performDeletion(document);
        } catch(err) {
            if (Array.isArray(err)) throw err;
            // Otherwise, the modal has been canceled.
        }
    }


    private async performDeletion(document: FieldDocument) {

        await this.deleteImageWithImageStore(document);
        await this.deleteWithPersistenceManager(document);
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


    private async fetchIsRecordedInCount(document: Document): Promise<number> {

        // TODO Use IndexFacade
        return !document.resource.id
            ? 0
            : (await this.datastore.find(
                    { q: '', constraints: { 'isRecordedIn:contain': document.resource.id }} as any)
            ).documents.length;
    }
}
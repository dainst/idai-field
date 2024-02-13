import { Injectable } from '@angular/core';
import { FieldDocument, Document, RelationsManager, Relation } from 'idai-field-core';
import { QrCodeService } from '../../service/qr-code-service';
import { Messages } from '../../../messages/messages';
import { M } from '../../../messages/m';


/**
 * @author Thomas Kleinke
 */
@Injectable()
export class StoragePlaceScanner {

    constructor(private relationsManager: RelationsManager,
                private qrCodeService: QrCodeService,
                private messages: Messages) {}


    public async scanStoragePlace(documents: Array<FieldDocument>) {

        const scannedCode: string = await this.qrCodeService.scanCode();
        if (!scannedCode) return;

        const storagePlaceDocument: FieldDocument = await this.qrCodeService.getDocumentFromScannedCode(scannedCode);

        try {
            for (let document of documents) {
                await this.setStoragePlace(document, storagePlaceDocument);
            }
        } catch (err) {
            this.messages.add([M.DOCEDIT_ERROR_SAVE]);
            console.error(err);
            return;
        }

        this.showSuccessMessage(documents, storagePlaceDocument);
    }


    private async setStoragePlace(document: FieldDocument, storagePlaceDocument: FieldDocument) {

        const clonedDocument: FieldDocument = Document.clone(document);
        const oldVersion: FieldDocument = Document.clone(document);
        clonedDocument.resource.relations[Relation.Inventory.ISSTOREDIN] = [storagePlaceDocument.resource.id];
        
        await this.relationsManager.update(clonedDocument, oldVersion);
    }


    private showSuccessMessage(documents: Array<FieldDocument>, storagePlaceDocument: FieldDocument) {

        if (documents.length === 1) {
            this.messages.add([
                M.RESOURCES_SUCCESS_STORAGE_PLACE_SAVED_SINGLE,
                documents[0].resource.identifier,
                storagePlaceDocument.resource.identifier
            ]);
        } else {
            this.messages.add([
                M.RESOURCES_SUCCESS_STORAGE_PLACE_SAVED_MULTIPLE,
                documents.length.toString(),
                storagePlaceDocument.resource.identifier
            ]);
        }
    }
}

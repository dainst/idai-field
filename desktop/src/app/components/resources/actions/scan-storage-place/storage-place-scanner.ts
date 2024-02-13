import { Injectable } from '@angular/core';
import { FieldDocument, Document, RelationsManager, Relation, Resource } from 'idai-field-core';
import { QrCodeService } from '../../service/qr-code-service';
import { Messages } from '../../../messages/messages';
import { M } from '../../../messages/m';


interface StoragePlaceScannerTask {

    document: FieldDocument,
    action: StoragePlaceScannerAction
}

type StoragePlaceScannerAction = 'none'|'new'|'addOrReplace';


/**
 * @author Thomas Kleinke
 */
@Injectable()
export class StoragePlaceScanner {

    constructor(private relationsManager: RelationsManager,
                private qrCodeService: QrCodeService,
                private messages: Messages) {}


    public async scanStoragePlace(documents: Array<FieldDocument>) {

        const storagePlaceDocument: FieldDocument = await this.scanCode();
        if (!storagePlaceDocument) return;

        const tasks: Array<StoragePlaceScannerTask> = StoragePlaceScanner.getTasks(documents, storagePlaceDocument);

        try {
            this.performTasks(tasks, storagePlaceDocument);
        } catch (err) {
            this.messages.add([M.DOCEDIT_ERROR_SAVE]);
            console.error(err);
            return;
        }

        this.showMessages(tasks, storagePlaceDocument);
    }


    private async scanCode(): Promise<FieldDocument> {

        const scannedCode: string = await this.qrCodeService.scanCode();
        if (!scannedCode) return;

        return this.qrCodeService.getDocumentFromScannedCode(scannedCode);
    }


    private async performTasks(tasks: Array<StoragePlaceScannerTask>, storagePlaceDocument) {

        const documents: Array<FieldDocument> = StoragePlaceScanner.getDocuments(tasks, 'new', 'addOrReplace');

        for (let document of documents) {
            await this.setStoragePlace(document, storagePlaceDocument);
        }
    }


    private async setStoragePlace(document: FieldDocument, storagePlaceDocument: FieldDocument) {

        const clonedDocument: FieldDocument = Document.clone(document);
        const oldVersion: FieldDocument = Document.clone(document);
        clonedDocument.resource.relations[Relation.Inventory.ISSTOREDIN] = [storagePlaceDocument.resource.id];
        
        await this.relationsManager.update(clonedDocument, oldVersion);
    }


    private showMessages(tasks: Array<StoragePlaceScannerTask>, storagePlaceDocument: FieldDocument) {

        let documents: Array<FieldDocument> = StoragePlaceScanner.getDocuments(tasks, 'new', 'addOrReplace');
        if (documents.length > 0) {
            this.showSuccessMessage(documents, storagePlaceDocument);
        } else {
            this.showAlreadySetMessage(StoragePlaceScanner.getDocuments(tasks, 'none'), storagePlaceDocument);
        }
    }


    private showSuccessMessage(documents: Array<FieldDocument>, storagePlaceDocument: FieldDocument) {

        if (documents.length === 1) {
            this.messages.add([
                M.RESOURCES_SUCCESS_STORAGE_PLACE_SAVED_SINGLE,
                documents[0].resource.identifier,
                storagePlaceDocument.resource.identifier
            ]);
        } else if (documents.length > 1) {
            this.messages.add([
                M.RESOURCES_SUCCESS_STORAGE_PLACE_SAVED_MULTIPLE,
                documents.length.toString(),
                storagePlaceDocument.resource.identifier
            ]);
        }
    }


    private showAlreadySetMessage(documents: Array<FieldDocument>, storagePlaceDocument: FieldDocument) {

        if (documents.length === 1) {
            this.messages.add([
                M.RESOURCES_INFO_STORAGE_PLACE_ALREADY_SET_SINGLE,
                documents[0].resource.identifier,
                storagePlaceDocument.resource.identifier
            ]);
        } else if (documents.length > 1) {
            this.messages.add([
                M.RESOURCES_INFO_STORAGE_PLACE_ALREADY_SET_MULTIPLE,
                documents.length.toString(),
                storagePlaceDocument.resource.identifier
            ]);
        }
    }


    private static getTasks(documents: Array<FieldDocument>,
                            storagePlaceDocument: FieldDocument): Array<StoragePlaceScannerTask> {

        return documents.map(document => StoragePlaceScanner.getTask(document, storagePlaceDocument));
    }


    private static getTask(document: FieldDocument, storagePlaceDocument: FieldDocument): StoragePlaceScannerTask {

        return {
            document,
            action: StoragePlaceScanner.getAction(document, storagePlaceDocument)
        };
    }


    private static getAction(document: FieldDocument, storagePlaceDocument: FieldDocument): StoragePlaceScannerAction {

        const relationTargets: string[] = document.resource.relations[Relation.Inventory.ISSTOREDIN];

        if (!relationTargets || relationTargets.length === 0) {
            return 'new';
        } else if (relationTargets.includes(storagePlaceDocument.resource.id)) {
            return 'none';
        } else {
            return 'addOrReplace';
        }
    }


    private static getDocuments(tasks: Array<StoragePlaceScannerTask>,
                                ...actions: Array<StoragePlaceScannerAction>): Array<FieldDocument> {

        return tasks.filter(task => actions.includes(task.action))
            .map(task => task.document);
    } 
}

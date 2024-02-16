import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { flatten, set } from 'tsfun';
import { FieldDocument, Document, RelationsManager, Relation, Datastore } from 'idai-field-core';
import { QrCodeService } from '../../service/qr-code-service';
import { Messages } from '../../../messages/messages';
import { M } from '../../../messages/m';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';
import { AngularUtility } from '../../../../angular/angular-utility';
import { ScanStoragePlaceModalComponent } from './scan-storage-place-modal.component';


interface StoragePlaceScannerTask {

    document: FieldDocument,
    action: StoragePlaceScannerAction
}

type StoragePlaceScannerAction = 'none'|'new'|'edit';

export type StoragePlaceEditMode = 'add'|'replace';


/**
 * @author Thomas Kleinke
 */
@Injectable()
export class StoragePlaceScanner {

    constructor(private relationsManager: RelationsManager,
                private qrCodeService: QrCodeService,
                private messages: Messages,
                private modalService: NgbModal,
                private menuService: Menus,
                private datastore: Datastore) {}


    public async scanStoragePlace(documents: Array<FieldDocument>) {

        const storagePlaceDocument: FieldDocument = await this.scanCode();
        if (!storagePlaceDocument) return;

        const tasks: Array<StoragePlaceScannerTask> = StoragePlaceScanner.getTasks(documents, storagePlaceDocument);
        const editMode: StoragePlaceEditMode = await this.getEditMode(tasks, storagePlaceDocument);
        if (!editMode) return;

        try {
            await this.performTasks(tasks, storagePlaceDocument, editMode);
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


    private async getEditMode(tasks: Array<StoragePlaceScannerTask>,
                              newStoragePlaceDocument: FieldDocument): Promise<StoragePlaceEditMode> {

        const documents: Array<FieldDocument> = StoragePlaceScanner.getDocuments(tasks, 'edit');
        if (!documents.find(document => document.resource.category === 'FindCollection')) return 'replace';

        const existingStoragePlaceDocuments: Array<FieldDocument> = await this.fetchStoragePlaceDocuments(documents);
        return this.selectEditModeViaModal(documents, existingStoragePlaceDocuments, newStoragePlaceDocument);
    }


    private async selectEditModeViaModal(documents: Array<FieldDocument>,
                                         existingStoragePlaceDocuments: Array<FieldDocument>,
                                         newStoragePlaceDocument: FieldDocument): Promise<StoragePlaceEditMode> {

        try {
            this.menuService.setContext(MenuContext.MODAL);

            const modalRef: NgbModalRef = this.modalService.open(
                ScanStoragePlaceModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            modalRef.componentInstance.documents = documents;
            modalRef.componentInstance.storagePlaceDocuments = existingStoragePlaceDocuments;
            modalRef.componentInstance.newStoragePlaceDocument = newStoragePlaceDocument;
            AngularUtility.blurActiveElement();
            return await modalRef.result;
        } catch (closeReason) {
            if (closeReason !== 'cancel') console.error(closeReason);
            return undefined;
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
        }
    }


    private async performTasks(tasks: Array<StoragePlaceScannerTask>, storagePlaceDocument: FieldDocument,
                               editMode: StoragePlaceEditMode) {

        const documents: Array<FieldDocument> = StoragePlaceScanner.getDocuments(tasks, 'new', 'edit');

        for (let document of documents) {
            await this.setStoragePlace(document, storagePlaceDocument, editMode);
        }
    }


    private async setStoragePlace(document: FieldDocument, storagePlaceDocument: FieldDocument,
                                  editMode: StoragePlaceEditMode) {

        const clonedDocument: FieldDocument = Document.clone(document);
        const oldVersion: FieldDocument = Document.clone(document);

        const relationTargets: string[] = clonedDocument.resource.relations[Relation.Inventory.ISSTOREDIN];
        if (!relationTargets || editMode === 'replace') {
            clonedDocument.resource.relations[Relation.Inventory.ISSTOREDIN] = [storagePlaceDocument.resource.id];
        } else {
            relationTargets.push(storagePlaceDocument.resource.id);
        } 
        
        await this.relationsManager.update(clonedDocument, oldVersion);
    }


    private async fetchStoragePlaceDocuments(documents: Array<FieldDocument>): Promise<Array<FieldDocument>> {

        const targetIds: string[] = set(flatten(
            documents.map(document => document.resource.relations[Relation.Inventory.ISSTOREDIN])
        ));

        return await this.datastore.getMultiple(targetIds) as Array<FieldDocument>;
    }


    private showMessages(tasks: Array<StoragePlaceScannerTask>, storagePlaceDocument: FieldDocument) {

        this.showSuccessMessage(StoragePlaceScanner.getDocuments(tasks, 'new', 'edit'), storagePlaceDocument);
        this.showAlreadySetMessage(StoragePlaceScanner.getDocuments(tasks, 'none'), storagePlaceDocument);
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
            return 'edit';
        }
    }


    private static getDocuments(tasks: Array<StoragePlaceScannerTask>,
                                ...actions: Array<StoragePlaceScannerAction>): Array<FieldDocument> {

        return tasks.filter(task => actions.includes(task.action))
            .map(task => task.document);
    } 
}

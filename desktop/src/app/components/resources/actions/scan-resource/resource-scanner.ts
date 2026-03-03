import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { flatten, set, to } from 'tsfun';
import { FieldDocument, Document, RelationsManager, Relation, Datastore, ProjectConfiguration, Named,
    Labels, CategoryForm } from 'idai-field-core';
import { QrCodeService } from '../../service/qr-code-service';
import { Messages } from '../../../messages/messages';
import { M } from '../../../messages/m';
import { Menus } from '../../../../services/menus';
import { MenuContext } from '../../../../services/menu-context';
import { AngularUtility } from '../../../../angular/angular-utility';
import { StoragePlaceScannerModalComponent } from './storage-place-scanner-modal.component';
import { TypeScannerModalComponent } from './type-scanner-modal.component';


interface ResourceScannerTask {

    document: FieldDocument,
    action: ResourceScannerAction
}

type ResourceScannerAction = 'none'|'new'|'edit';

export type ResourceEditMode = 'add'|'replace';


/**
 * @author Thomas Kleinke
 */
@Injectable()
export class ResourceScanner {

    constructor(private relationsManager: RelationsManager,
                private qrCodeService: QrCodeService,
                private messages: Messages,
                private modalService: NgbModal,
                private menuService: Menus,
                private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration,
                private labels: Labels) {}


    public async scanResources(documents: Array<FieldDocument>) {

        const targetDocument: FieldDocument = await this.scanCode();
        if (!targetDocument) return;

        const validTargetCategoryNames: string[] = this.getValidTargetCategoryNames(documents);
        console.log({ validTargetCategoryNames });

        if (!validTargetCategoryNames.includes(targetDocument.resource.category)) {
            return this.showInvalidTargetCategoryMessage(targetDocument, validTargetCategoryNames);
        }

        const relationName: string = this.getRelationName(targetDocument);
        const tasks: Array<ResourceScannerTask> = ResourceScanner.getTasks(documents, targetDocument, relationName);
        const editMode: ResourceEditMode = await this.getEditMode(tasks, targetDocument, relationName);
        if (!editMode) return;

        try {
            await this.performTasks(tasks, targetDocument, relationName, editMode);
        } catch (err) {
            this.messages.add([M.DOCEDIT_ERROR_SAVE]);
            console.error(err);
            return;
        }

        this.showMessages(tasks, targetDocument, relationName);
    }


    private async scanCode(): Promise<FieldDocument> {

        const scannedCode: string = await this.qrCodeService.scanCode();
        if (!scannedCode) return;

        return this.qrCodeService.getDocumentFromScannedCode(scannedCode);
    }


    private async getEditMode(tasks: Array<ResourceScannerTask>, newTargetDocument: FieldDocument,
                              relationName: string): Promise<ResourceEditMode> {

        const documents: Array<FieldDocument> = ResourceScanner.getDocuments(tasks, 'edit');
        if (!documents.length || (relationName === Relation.Inventory.ISSTOREDIN &&
                 !documents.find(document => document.resource.category === 'FindCollection'))) {
            return 'replace';
        }

        const existingTargetDocuments: Array<FieldDocument> = await this.fetchTargetDocuments(
            documents, relationName
        );
    
        return this.selectEditModeViaModal(
            documents, existingTargetDocuments, newTargetDocument, relationName
        );
    }


    private async selectEditModeViaModal(documents: Array<FieldDocument>,
                                         existingTargetDocuments: Array<FieldDocument>,
                                         newTargetDocument: FieldDocument,
                                         relationName: string): Promise<ResourceEditMode> {

        try {
            this.menuService.setContext(MenuContext.MODAL);

            const modalRef: NgbModalRef = this.modalService.open(
                relationName === Relation.Type.INSTANCEOF
                    ? TypeScannerModalComponent
                    : StoragePlaceScannerModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            modalRef.componentInstance.documents = documents;

            if (relationName === Relation.Type.INSTANCEOF) {
                modalRef.componentInstance.typeDocuments = existingTargetDocuments;
                modalRef.componentInstance.newTypeDocument = newTargetDocument;
            } else {
                modalRef.componentInstance.storagePlaceDocuments = existingTargetDocuments;
                modalRef.componentInstance.newStoragePlaceDocument = newTargetDocument;
            }
            AngularUtility.blurActiveElement();
            return await modalRef.result;
        } catch (closeReason) {
            if (closeReason !== 'cancel') console.error(closeReason);
            return undefined;
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
        }
    }


    private async performTasks(tasks: Array<ResourceScannerTask>, targetDocument: FieldDocument,
                               relationName: string, editMode: ResourceEditMode) {

        const documents: Array<FieldDocument> = ResourceScanner.getDocuments(tasks, 'new', 'edit');

        for (let document of documents) {
            await this.setTargetDocument(document, targetDocument, relationName, editMode);
        }
    }


    private async setTargetDocument(document: FieldDocument, targetDocument: FieldDocument,
                                    relationName: string, editMode: ResourceEditMode) {

        const clonedDocument: FieldDocument = Document.clone(document);
        const oldVersion: FieldDocument = Document.clone(document);

        const relationTargets: string[] = clonedDocument.resource.relations[relationName];
        if (!relationTargets || editMode === 'replace') {
            clonedDocument.resource.relations[relationName] = [targetDocument.resource.id];
        } else {
            relationTargets.push(targetDocument.resource.id);
        } 
        
        await this.relationsManager.update(clonedDocument, oldVersion);
    }


    private async fetchTargetDocuments(documents: Array<FieldDocument>,
                                       relationName: string): Promise<Array<FieldDocument>> {

        const targetIds: string[] = set(flatten(
            documents.map(document => document.resource.relations[relationName])
        ));

        return await this.datastore.getMultiple(targetIds) as Array<FieldDocument>;
    }


    private showMessages(tasks: Array<ResourceScannerTask>, targetDocument: FieldDocument, relationName: string) {

        this.showSuccessMessage(ResourceScanner.getDocuments(tasks, 'new', 'edit'), targetDocument, relationName);
        this.showAlreadySetMessage(ResourceScanner.getDocuments(tasks, 'none'), targetDocument, relationName);
    }


    private showSuccessMessage(documents: Array<FieldDocument>, targetDocument: FieldDocument, relationName: string) {

        console.log('relationName:', relationName);

        if (documents.length === 1) {
            this.messages.add([
                (relationName === Relation.Type.INSTANCEOF
                    ? M.RESOURCES_SUCCESS_TYPE_SAVED_SINGLE
                    : M.RESOURCES_SUCCESS_STORAGE_PLACE_SAVED_SINGLE),
                documents[0].resource.identifier,
                targetDocument.resource.identifier
            ]);
        } else if (documents.length > 1) {
            this.messages.add([
                (relationName === Relation.Type.INSTANCEOF
                    ? M.RESOURCES_SUCCESS_TYPES_SAVED_MULTIPLE
                    : M.RESOURCES_SUCCESS_STORAGE_PLACE_SAVED_MULTIPLE),
                documents.length.toString(),
                targetDocument.resource.identifier
            ]);
        }
    }


    private showAlreadySetMessage(documents: Array<FieldDocument>, targetDocument: FieldDocument,
                                  relationName: string) {

        if (documents.length === 1) {
            this.messages.add([
                (relationName === Relation.Type.INSTANCEOF
                    ? M.RESOURCES_INFO_TYPE_ALREADY_SET_SINGLE
                    : M.RESOURCES_INFO_STORAGE_PLACE_ALREADY_SET_SINGLE),
                documents[0].resource.identifier,
                targetDocument.resource.identifier
            ]);
        } else if (documents.length > 1) {
            this.messages.add([
                (relationName === Relation.Type.INSTANCEOF
                    ? M.RESOURCES_INFO_TYPE_ALREADY_SET_MULTIPLE
                    : M.RESOURCES_INFO_STORAGE_PLACE_ALREADY_SET_MULTIPLE),
                documents.length.toString(),
                targetDocument.resource.identifier
            ]);
        }
    }


    private getValidTargetCategoryNames(documents: Array<FieldDocument>): string[] {

        const supercategoryNames: string[] = this.getNamesOfAllowedSupercategories(documents);

        return this.projectConfiguration.getQrCodeCategories().filter(category => {
            return supercategoryNames.includes(category.name)
                || supercategoryNames.includes(category.parentCategory?.name);
        }).map(to(Named.NAME));
    }


    private getNamesOfAllowedSupercategories(documents: Array<FieldDocument>): string[] {

        const result: string[] = [];
        
        if (documents.every(document => {
            return this.projectConfiguration.isAllowedRelationDomainCategory(
                document.resource.category, 'StoragePlace', Relation.Inventory.ISSTOREDIN
            );
        })) result.push('StoragePlace');

        if (documents.every(document => {
            return this.projectConfiguration.isAllowedRelationDomainCategory(
                document.resource.category, 'Type', Relation.Type.INSTANCEOF
            );
        })) result.push('Type');

        return result;
    }

    
    private getRelationName(targetDocument: FieldDocument): string {

        return this.projectConfiguration.isSubcategory(
            targetDocument.resource.category, 'Type'
        ) ? Relation.Type.INSTANCEOF
        : Relation.Inventory.ISSTOREDIN;
    }


    private showInvalidTargetCategoryMessage(targetDocument: FieldDocument, validTargetCategoryNames: string[]) {

        const category: CategoryForm = this.projectConfiguration.getCategory(targetDocument.resource.category);

        this.messages.add([
            this.getInvalidTargetCategoryMessageCode(validTargetCategoryNames),
            targetDocument.resource.identifier,
            this.labels.get(category)
        ]);
    }


    private getInvalidTargetCategoryMessageCode(validTargetCategoryNames: string[]): string {

        const isTypeAllowed: boolean = validTargetCategoryNames.some(categoryName => {
            return this.projectConfiguration.getTypeCategories().map(to(Named.NAME)).includes(categoryName);
        });

        const isStoragePlaceAllowed: boolean = validTargetCategoryNames.some(categoryName => {
            return this.projectConfiguration.getInventoryCategories().map(to(Named.NAME)).includes(categoryName);
        });

        if (isTypeAllowed && !isStoragePlaceAllowed) {
            return M.RESOURCES_ERROR_NO_TYPE_CATEGORY;
        } else if (!isTypeAllowed && isStoragePlaceAllowed) {
            return M.RESOURCES_ERROR_NO_STORAGE_PLACE_CATEGORY;
        } else {
            return M.RESOURCES_ERROR_NO_STORAGE_PLACE_OR_TYPE_CATEGORY;
        }
    }


    private static getTasks(documents: Array<FieldDocument>, targetDocument: FieldDocument,
                            relationName: string): Array<ResourceScannerTask> {

        return documents.map(document => {
            return ResourceScanner.getTask(document, targetDocument, relationName);
        });
    }


    private static getTask(document: FieldDocument, targetDocument: FieldDocument,
                           relationName: string): ResourceScannerTask {

        return {
            document,
            action: ResourceScanner.getAction(document, targetDocument, relationName)
        };
    }


    private static getAction(document: FieldDocument, targetDocument: FieldDocument,
                             relationName: string): ResourceScannerAction {

        const relationTargets: string[] = document.resource.relations[relationName];

        if (!relationTargets || relationTargets.length === 0) {
            return 'new';
        } else if (relationTargets.includes(targetDocument.resource.id)) {
            return 'none';
        } else {
            return 'edit';
        }
    }


    private static getDocuments(tasks: Array<ResourceScannerTask>,
                                ...actions: Array<ResourceScannerAction>): Array<FieldDocument> {

        return tasks.filter(task => actions.includes(task.action))
            .map(task => task.document);
    }
}

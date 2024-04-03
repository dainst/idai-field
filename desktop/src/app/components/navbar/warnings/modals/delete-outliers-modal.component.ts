import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { isArray, isObject, isString } from 'tsfun';
import { CategoryForm, Datastore, Dimension, Document, Field, ProjectConfiguration } from 'idai-field-core';
import { DeletionInProgressModalComponent } from '../../../widgets/deletion-in-progress-modal.component';


@Component({
    templateUrl: './delete-outliers-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class DeleteOutliersModalComponent {

    public document: Document;
    public field: Field;
    public fieldLabel: string|undefined;
    public outlierValue: string;

    public deleteAll: boolean;


    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration) {}


    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public async performDeletion() {

        const deletionInProgressModal: NgbModalRef = this.openDeletionInProgressModal();
        
        if (this.deleteAll) {
            await this.deleteMultiple();
        } else {
            await this.deleteSingle();
        }

        deletionInProgressModal.close();
        this.activeModal.close();
    }


    private openDeletionInProgressModal(): NgbModalRef {

        const deletionInProgressModalRef: NgbModalRef = this.modalService.open(
            DeletionInProgressModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );
        deletionInProgressModalRef.componentInstance.mode = 'value';
        deletionInProgressModalRef.componentInstance.multiple = this.deleteAll;
        
        return deletionInProgressModalRef;
    }


    private async deleteSingle() {

        this.deleteValue(this.document, this.field);

        await this.datastore.update(this.document);
    }


    private async deleteMultiple() {

        const documents = (await this.datastore.find({
            constraints: { ['outlierValues:contain']: this.outlierValue }
        })).documents;

        const changedDocuments: Array<Document> = [];

        for (let document of documents) {
            const category: CategoryForm = this.projectConfiguration.getCategory(document.resource.category);

            for (let fieldName of Object.keys(document.warnings.outliers.fields)) {
                if (!document.warnings.outliers.fields[fieldName].includes(this.outlierValue)) continue;
                const field: Field = CategoryForm.getField(category, fieldName);
                this.deleteValue(document, field);
                if (!changedDocuments.includes(document)) changedDocuments.push(document);
            }
        }

        await this.datastore.bulkUpdate(documents);
    }


    private deleteValue(document: Document, field: Field) {

        const fieldContent: any = document.resource[field.name];

        if (isArray(fieldContent)) {
            document.resource[field.name] = this.removeValueFromArray(fieldContent, field);
            if (document.resource[field.name].length === 0) delete document.resource[field.name];
        } else {
            if (isString(fieldContent) && fieldContent === this.outlierValue) {
                delete document.resource[field.name]
            } else if (isObject(fieldContent) && field.inputType === Field.InputType.DROPDOWNRANGE) {
                if (fieldContent.value === this.outlierValue) {
                    delete document.resource[field.name];
                } else if (fieldContent.endValue === this.outlierValue) {
                    delete fieldContent.endValue;
                }
            }
        }
    }

    
    private removeValueFromArray(array: any[], field: Field): any[] {

        if (field.inputType === Field.InputType.DIMENSION) {
            array.forEach((entry: Dimension) => {
                if (entry.measurementPosition === this.outlierValue) delete entry.measurementPosition;
            });
            return array;
        } else {
            return array.filter(entry => entry !== this.outlierValue);
        }
    }
}

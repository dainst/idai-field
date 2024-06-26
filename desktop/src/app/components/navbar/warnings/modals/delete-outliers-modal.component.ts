import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { flatten, isArray, isObject, isString, isEmpty } from 'tsfun';
import { BaseField, CategoryForm, Datastore, Dimension, Document, Field, ProjectConfiguration } from 'idai-field-core';
import { DeletionInProgressModalComponent } from '../../../widgets/deletion-in-progress-modal.component';
import { AngularUtility } from '../../../../angular/angular-utility';


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


    public getFieldLabelHTML(): string {

        return this.fieldLabel
            ? '<span><b>' + this.fieldLabel + '</b> (<code>' + this.field.name + '</code>)</span>'
            : '<code>' + this.field.name + '</code>';
    }


    public async performDeletion() {

        const deletionInProgressModal: NgbModalRef = this.openDeletionInProgressModal();

        await AngularUtility.refresh();
        
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

        this.deleteValue(this.document, this.document.resource, this.field);

        await this.datastore.update(this.document);
    }


    private async deleteMultiple() {

        const documents = (await this.datastore.find({
            constraints: { ['outlierValues:contain']: this.outlierValue }
        }, { includeResourcesWithoutValidParent: true })).documents;

        const changedDocuments: Array<Document> = [];

        for (let document of documents) {
            const category: CategoryForm = this.projectConfiguration.getCategory(document.resource.category);

            for (let fieldName of Object.keys(document.warnings.outliers.fields)) {
                const field: Field = CategoryForm.getField(category, fieldName);
                if (!this.hasOutlierValue(document, field)) continue;
                this.deleteValue(document, document.resource, field);
                if (!changedDocuments.includes(document)) changedDocuments.push(document);
            }
        }

        await this.datastore.bulkUpdate(changedDocuments);
    }


    private deleteValue(document: Document, fieldContainer: any, field: BaseField) {

        const fieldContent: any = fieldContainer[field.name];

        if (isArray(fieldContent)) {
            fieldContainer[field.name] = this.removeValueFromArray(fieldContent, field, document);
            if (fieldContainer[field.name].length === 0) delete fieldContainer[field.name];
        } else {
            if (isString(fieldContent) && fieldContent === this.outlierValue) {
                delete fieldContainer[field.name]
            } else if (isObject(fieldContent) && field.inputType === Field.InputType.DROPDOWNRANGE) {
                if (fieldContent.value === this.outlierValue) {
                    delete fieldContainer[field.name];
                } else if (fieldContent.endValue === this.outlierValue) {
                    delete fieldContent.endValue;
                }
            }
        }
    }

    
    private removeValueFromArray(array: any[], field: BaseField, document: Document): any[] {

        if (field.inputType === Field.InputType.DIMENSION) {
            array.forEach((entry: Dimension) => {
                if (entry.measurementPosition === this.outlierValue) delete entry.measurementPosition;
            });
            return array;
        } else if (field.inputType === Field.InputType.COMPOSITE) {
            array.forEach(entry => this.removeValueFromCompositeEntry(entry, field, document));
            return array.filter(entry => !isEmpty(entry));
        } else {
            return array.filter(entry => entry !== this.outlierValue);
        }
    }


    private removeValueFromCompositeEntry(entry: any, field: Field, document: Document) {

        field.subfields.filter(subfield => {
            return (document.warnings.outliers.fields[field.name][subfield.name])
                ?.includes(this.outlierValue);
        }).forEach(subfield => this.deleteValue(document, entry, subfield));
    }


    private hasOutlierValue(document: Document, field: Field): boolean {

        const outlierValues: string[] = field.inputType === Field.InputType.COMPOSITE
            ?  flatten(Object.values(document.warnings.outliers.fields[field.name]))
            : (document.warnings.outliers.fields[field.name]);

        return outlierValues.includes(this.outlierValue);
    }
}

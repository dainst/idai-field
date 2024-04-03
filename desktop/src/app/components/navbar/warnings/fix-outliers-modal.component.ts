import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { equal, isArray, isObject, isString, set } from 'tsfun';
import { CategoryForm, Datastore, Dimension, Document, Field, Hierarchy, Labels, OptionalRange, ProjectConfiguration,
     Valuelist, ValuelistUtil } from 'idai-field-core';
import { FixingDataInProgressModalComponent } from './fixing-data-in-progress-modal.component';


@Component({
    templateUrl: './fix-outliers-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class FixOutliersModalComponent {

    public document: Document;
    public field: Field;
    public outlierValue: string;
    
    public valuelist: Valuelist;
    public selectedValue: string;
    public replaceAll: boolean;

    private projectDocument: Document;


    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration,
                private labels: Labels) {}

    
    public getValues = () => this.valuelist ? this.labels.orderKeysByLabels(this.valuelist) : [];

    public getValueLabel = (value: string) => this.labels.getValueLabel(this.valuelist, value);

    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public async initialize() {

        this.projectDocument = await this.datastore.get('project');
        this.valuelist = await this.getValuelist(this.document, this.field);
    }


    public async performReplacement() {

        const fixingDataInProgressModal: NgbModalRef = this.openFixingDataInProgressModal();
        
        if (this.replaceAll) {
            await this.replaceMultiple();
        } else {
            await this.replaceSingle();
        }

        fixingDataInProgressModal.close();
        this.activeModal.close();
    }


    private openFixingDataInProgressModal(): NgbModalRef {

        const fixingDataInProgressModalRef: NgbModalRef = this.modalService.open(
            FixingDataInProgressModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );
        fixingDataInProgressModalRef.componentInstance.multiple = this.replaceAll;
        
        return fixingDataInProgressModalRef;
    }


    private async replaceSingle() {

        this.replaceValue(this.document, this.field.name);

        await this.datastore.update(this.document);
    }


    private async replaceMultiple() {

        const documents = (await this.datastore.find({
            constraints: { ['outlierValues:contain']: this.outlierValue }
        })).documents;

        const changedDocuments: Array<Document> = [];

        for (let document of documents) {
            const category: CategoryForm = this.projectConfiguration.getCategory(document.resource.category);

            for (let fieldName of Object.keys(document.warnings.outliers.fields)) {
                const field: Field = CategoryForm.getField(category, fieldName);
                if (!document.warnings.outliers.fields[fieldName].includes(this.outlierValue)) continue;
                const valuelist: Valuelist = await this.getValuelist(document, field);
                if (equal(valuelist, this.valuelist)) {
                    this.replaceValue(document, fieldName);
                    if (!changedDocuments.includes(document)) changedDocuments.push(document);
                }
            }
        }

        await this.datastore.bulkUpdate(documents);
    }


    private replaceValue(document: Document, fieldName: string) {

        const fieldContent: any = document.resource[fieldName];

        if (isArray(fieldContent)) {
            document.resource[fieldName] = set(fieldContent.map(entry => this.getReplacement(entry)));
        } else {
            document.resource[fieldName] = this.getReplacement(fieldContent);
        }
    }


    private getReplacement(entry: any): any {

        if (isString(entry) && entry === this.outlierValue) {
            return this.selectedValue;
        } else if (isObject(entry)) {
            if (this.field.inputType === Field.InputType.DIMENSION
                    && entry[Dimension.MEASUREMENTPOSITION] === this.outlierValue) {
                entry.measurementPosition = this.outlierValue;
            } else if (this.field.inputType === Field.InputType.DROPDOWNRANGE
                    && entry[OptionalRange.VALUE] === this.outlierValue) {
                entry.value = this.outlierValue;
            } else if (this.field.inputType === Field.InputType.DROPDOWNRANGE
                    && entry[OptionalRange.ENDVALUE] === this.outlierValue) {
                entry.endValue = this.outlierValue;
            } else {
                return entry;
            }
        } else {
            return entry;
        }
    }


    private async getValuelist(document: Document, field: Field): Promise<Valuelist> {

        return ValuelistUtil.getValuelist(
            field,
            this.projectDocument, 
            await Hierarchy.getParentResource(this.datastore.get, document.resource)
        );
    }
}

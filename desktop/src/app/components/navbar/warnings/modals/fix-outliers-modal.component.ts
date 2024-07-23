import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { equal, flatten, isArray, isObject, isString, set, Map } from 'tsfun';
import { CategoryForm, Datastore, Dimension, Document, Field, Hierarchy, Labels, OptionalRange, ProjectConfiguration,
     Valuelist, ValuelistUtil, BaseField } from 'idai-field-core';
import { FixingDataInProgressModalComponent } from './fixing-data-in-progress-modal.component';
import { AngularUtility } from '../../../../angular/angular-utility';
import { AffectedDocument } from '../affected-document';


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
    public countAffected: number;

    private projectDocument: Document;
    private affectedDocuments: Array<AffectedDocument>;


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
        this.affectedDocuments = [];

        const foundDocuments: Array<Document> = (await this.datastore.find({
            constraints: { ['outlierValues:contain']: this.outlierValue }
        }, { includeResourcesWithoutValidParent: true })).documents;

        for (let document of foundDocuments) {
            const category: CategoryForm = this.projectConfiguration.getCategory(document.resource.category);
            const affectedDocument: AffectedDocument = { document: document, fields: [] };

            for (let fieldName of Object.keys(document.warnings.outliers.fields)) {
                const field: Field = CategoryForm.getField(category, fieldName);
                if (!this.hasOutlierValue(document, field)) continue;
                const valuelist: Valuelist = await this.getValuelist(document, field);
                if (valuelist && equal(valuelist, this.valuelist)) {
                    affectedDocument.fields.push(field);
                }
            }

            if (affectedDocument.fields.length) this.affectedDocuments.push(affectedDocument);
        }

        this.countAffected = this.affectedDocuments.length;
    }


    public async performReplacement() {

        if (!this.selectedValue) return;

        const fixingDataInProgressModal: NgbModalRef = this.openFixingDataInProgressModal();

        await AngularUtility.refresh();
        
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

        this.replaceValue(this.document, this.document.resource, this.field);
        
        await this.datastore.update(this.document);
    }


    private async replaceMultiple() {
        
        for (let affectedDocument of this.affectedDocuments) {
            for (let field of affectedDocument.fields) {
                this.replaceValue(affectedDocument.document, affectedDocument.document.resource, field);
            }
        }

        await this.datastore.bulkUpdate(
            this.affectedDocuments.map(affectedDocument => affectedDocument.document)
        );
    }


    private replaceValue(document: Document, fieldContainer: any, field: BaseField) {

        const fieldContent: any = fieldContainer[field.name];

        if (isArray(fieldContent)) {
            fieldContainer[field.name] = set(fieldContent.map(entry => this.getReplacement(document, entry, field)));
        } else {
            fieldContainer[field.name] = this.getReplacement(document, fieldContent, field);
        }
    }


    private getReplacement(document: Document, entry: any, field: Field): any {

        if (isString(entry) && entry === this.outlierValue) {
            return this.selectedValue;
        } else if (isObject(entry)) {
            if (field.inputType === Field.InputType.DIMENSION
                    && entry[Dimension.MEASUREMENTPOSITION] === this.outlierValue) {
                entry.measurementPosition = this.selectedValue;
            } else if (field.inputType === Field.InputType.DROPDOWNRANGE
                    && entry[OptionalRange.VALUE] === this.outlierValue) {
                entry.value = this.selectedValue;
            } else if (field.inputType === Field.InputType.DROPDOWNRANGE
                    && entry[OptionalRange.ENDVALUE] === this.outlierValue) {
                entry.endValue = this.selectedValue;
            } else if (field.inputType === Field.InputType.COMPOSITE) {
                this.replaceValueInCompositeEntry(document, entry, field);
            }
        }
        
        return entry;
    }

    
    private replaceValueInCompositeEntry(document: Document, entry: any, field: Field) {

        field.subfields.filter(subfield => {
            return subfield.valuelist
                && equal(subfield.valuelist, this.valuelist)
                && (document.warnings.outliers.fields[field.name][subfield.name])?.includes(this.outlierValue);
        }).forEach(subfield => this.replaceValue(document, entry, subfield));
    }


    private hasOutlierValue(document: Document, field: Field): boolean {

        const outlierValues: string[] = field.inputType === Field.InputType.COMPOSITE
            ?  flatten(Object.values(document.warnings.outliers.fields[field.name]))
            : (document.warnings.outliers.fields[field.name]);

        return outlierValues.includes(this.outlierValue);
    }


    private async getValuelist(document: Document, field: Field): Promise<Valuelist> {

        const valuelistField: BaseField = field.inputType === Field.InputType.COMPOSITE
            ? field.subfields.find(subfield => {
                return (document.warnings.outliers.fields[field.name][subfield.name])?.includes(this.outlierValue);
            }) : field;

        return ValuelistUtil.getValuelist(
            valuelistField,
            this.projectDocument,
            this.projectConfiguration,
            await Hierarchy.getParentResource(this.datastore.get, document.resource)
        );
    }
}

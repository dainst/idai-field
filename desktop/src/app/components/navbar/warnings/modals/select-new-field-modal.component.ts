import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Datastore, Document, Field, Labels, WarningType } from 'idai-field-core';
import { FixingDataInProgressModalComponent } from './fixing-data-in-progress-modal.component';
import { AngularUtility } from '../../../../angular/angular-utility';


@Component({
    templateUrl: './select-new-field-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class SelectNewFieldModalComponent {

    public document: Document;
    public fieldName: string;
    public fieldLabel: string;
    public category: CategoryForm;
    public warningType: WarningType;

    public availableFields: Array<Field>;
    public selectedFieldName: string;
    public multiple: boolean;

    public countAffected: Number;
    
    private affectedDocuments: Array<Document>;


    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private datastore: Datastore,
                private labels: Labels) {}

    
    public getFieldLabel = (field: Field) => this.labels.getFieldLabel(this.category, field.name);
    
    public getCategoryLabel = () => this.labels.get(this.category);

    public cancel = () => this.activeModal.dismiss('cancel');

    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public async initialize() {
        
        this.availableFields = this.getAvailableFields();

        const findResult = await this.datastore.find({
            categories: [this.category.name],
            constraints: { [this.warningType + ':contain']: this.fieldName }
        }, { includeResourcesWithoutValidParent: true });

        this.countAffected = findResult.totalCount;
        this.affectedDocuments = findResult.documents;

    }


    public getFieldLabelHTML(fieldName: string): string {

        const fieldLabel: string = this.fieldName === fieldName
            ? this.fieldLabel
            : this.getFieldLabelForName(fieldName);

        return fieldLabel
            ? '<span><b>' + fieldLabel + '</b> (<code>' + fieldName + '</code>)</span>'
            : '<code>' + fieldName + '</code>';
    }


    public async perform() {

        if (!this.selectedFieldName) return;

        const fixingDataInProgressModal: NgbModalRef = this.openFixingDataInProgressModal();

        await AngularUtility.refresh();

        if (this.multiple) {
            await this.moveMultiple();
        } else {
            await this.moveSingle();
        }

        fixingDataInProgressModal.close();
        this.activeModal.close();
    }


    private async moveSingle() {

        this.moveDataToNewField(this.document);
        await this.datastore.update(this.document);
    }


    private async moveMultiple() {

        this.affectedDocuments.forEach(document => this.moveDataToNewField(document));

        await this.datastore.bulkUpdate(this.affectedDocuments);
    }


    private moveDataToNewField(document: Document) {

        document.resource[this.selectedFieldName] = document.resource[this.fieldName];
        delete document.resource[this.fieldName];
    }


    private getAvailableFields(): Array<Field> {

        const forbiddenInputTypes: Array<Field.InputType> = Field.InputType.RELATION_INPUT_TYPES.concat([
            Field.InputType.CATEGORY, Field.InputType.IDENTIFIER, Field.InputType.NONE
        ] as Array<Field.InputType>);

        return CategoryForm.getFields(this.category)
            .filter(field => !forbiddenInputTypes.includes(field.inputType));
    }


    private openFixingDataInProgressModal(): NgbModalRef {

        const fixingDataInProgressModalRef: NgbModalRef = this.modalService.open(
            FixingDataInProgressModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );
        fixingDataInProgressModalRef.componentInstance.multiple = this.multiple;
        
        return fixingDataInProgressModalRef;
    }


    private getFieldLabelForName(fieldName: string): string {

        const selectedField: Field = this.availableFields.find(field => field.name === fieldName);
        return this.getFieldLabel(selectedField);
    }
}

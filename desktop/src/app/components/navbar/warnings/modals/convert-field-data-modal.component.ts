import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CategoryForm, Datastore, Document, Field, InvalidDataUtil, Labels } from 'idai-field-core';
import { FixingDataInProgressModalComponent } from './fixing-data-in-progress-modal.component';
import { AngularUtility } from '../../../../angular/angular-utility';


@Component({
    templateUrl: './convert-field-data-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class ConvertFieldDataModalComponent {

    public document: Document;
    public fieldName: string;
    public fieldLabel: string;
    public category: CategoryForm;
    public inputType: Field.InputType;
    public inputTypeLabel: string;

    public convertAll: boolean;
    public countAffected: string;
    
    private affectedDocuments: Array<Document>;


    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private datastore: Datastore,
                private labels: Labels) {}


    public getCategoryLabel = () => this.labels.get(this.category);

    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }

    public async initialize() {

        const findResult = await this.datastore.find({
            categories: [this.category.name],
            constraints: { ['invalidFields:contain']: this.fieldName }
        }, { includeResourcesWithoutValidParent: true });
        
        this.countAffected = findResult.totalCount.toString();
        this.affectedDocuments = findResult.documents.filter(document => this.isConvertible(document));

    }

    public getFieldLabelHTML(): string {

        return this.fieldLabel
            ? '<span><b>' + this.fieldLabel + '</b> (<code>' + this.fieldName + '</code>)</span>'
            : '<code>' + this.fieldName + '</code>';
    }


    public async performConversion() {

        const fixingDataInProgressModal: NgbModalRef = this.openFixingDataInProgressModal();

        await AngularUtility.refresh();
        
        if (this.convertAll) {
            await this.convertMultiple();
        } else {
            await this.convertSingle();
        }

        fixingDataInProgressModal.close();
        this.activeModal.close();
    }


    private openFixingDataInProgressModal(): NgbModalRef {

        const fixingDataInProgressModalRef: NgbModalRef = this.modalService.open(
            FixingDataInProgressModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );
        fixingDataInProgressModalRef.componentInstance.multiple = this.convertAll;
        
        return fixingDataInProgressModalRef;
    }


    private async convertSingle() {

        this.convert(this.document);
        await this.datastore.update(this.document);
    }


    private async convertMultiple() {

        this.affectedDocuments.forEach(document => this.convert(document));

        await this.datastore.bulkUpdate(this.affectedDocuments);
    }


    private isConvertible(document: Document): boolean {

        return InvalidDataUtil.isConvertible(
            document.resource[this.fieldName],
            this.inputType
        );
    }


    private convert(document: Document) {

        document.resource[this.fieldName] = InvalidDataUtil.convert(
            document.resource[this.fieldName],
            this.inputType
        );
    }
}

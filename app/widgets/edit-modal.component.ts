import {Component,ViewChild,TemplateRef} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DocumentEditChangeMonitor} from "idai-components-2/documents";


@Component({
    selector: 'detail-modal',
    moduleId: module.id,
    templateUrl: './edit-modal.html'
})
export class EditModalComponent {

    doc:IdaiFieldDocument;

    @ViewChild('modalTemplate')

    modalTemplate: TemplateRef<any>;
    dialog: NgbModalRef;

    constructor(public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private documentEditChangeMonitor: DocumentEditChangeMonitor
    ) {
    }

    public showModal() {
        this.dialog = this.modalService.open(this.modalTemplate);
    }

    public setDocument(document: IdaiFieldDocument) {
        this.doc = document;
    }

    public cancel() {
        if (this.documentEditChangeMonitor.isChanged()) {
            this.showModal()
        } else {
            this.activeModal.dismiss("cancel")
        }
    }
}
import {Component,ViewChild,TemplateRef} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from '../model/idai-field-document';
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
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
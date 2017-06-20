import {Component, ViewChild, TemplateRef} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Messages} from 'idai-components-2/messages';

@Component({
    selector: 'detail-modal',
    moduleId: module.id,
    templateUrl: './edit-modal.html'
})
export class EditModalComponent {

    public doc: IdaiFieldDocument;
    public activeTab: string;
    public deleteButtonShown = false;

    @ViewChild('modalTemplate') public modalTemplate: TemplateRef<any>;
    public dialog: NgbModalRef;

    constructor(public activeModal: NgbActiveModal,
                public messages: Messages,
                private modalService: NgbModal,
                private documentEditChangeMonitor: DocumentEditChangeMonitor
    ) { }

    public showModal() {
        this.dialog = this.modalService.open(this.modalTemplate);
    }

    public showDeleteButton() {
        this.deleteButtonShown = true;
    }

    public setDocument(document: IdaiFieldDocument) {
        this.doc = document;
    }

    public setActiveTab(activeTabName: string) {
        this.activeTab = activeTabName;
    }

    public cancel() {
        if (this.documentEditChangeMonitor.isChanged()) {
            this.showModal();
        } else {
            this.activeModal.dismiss('cancel');
        }
    }
}
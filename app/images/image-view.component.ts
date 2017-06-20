import {Component, OnInit} from "@angular/core";
import {ActivatedRoute,Router} from "@angular/router";
import {Datastore} from "idai-components-2/datastore";
import {ImageComponentBase} from "./image-component-base";
import {Messages} from "idai-components-2/messages";
import {Imagestore} from "../imagestore/imagestore";
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {EditModalComponent} from '../docedit/edit-modal.component';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';

@Component({
    moduleId: module.id,
    templateUrl: './image-view.html'
})

/**
 * @author Daniel de Oliveira
 */
export class ImageViewComponent extends ImageComponentBase implements OnInit {

    constructor(
        route: ActivatedRoute,
        datastore: Datastore,
        imagestore: Imagestore,
        messages: Messages,
        private router: Router,
        private modalService: NgbModal,
        private documentEditChangeMonitor: DocumentEditChangeMonitor
    ) {
        super(route, datastore, imagestore, messages);
    }

    ngOnInit() {
        this.fetchDocAndImage();
        window.getSelection().removeAllRanges();
    }

    public selectRelatedDocument(documentToJumpTo) {
        this.router.navigate(['resources', { id: documentToJumpTo.resource.id }])
    }

    public deselect() {
        this.router.navigate(['images']);
    }

    public startEdit(doc: IdaiFieldDocument) {

        var detailModalRef = this.modalService.open(EditModalComponent, {size: 'lg', backdrop: 'static'});
        var detailModal = detailModalRef.componentInstance;

        detailModalRef.result.then(result => {
            if (result.document) this.image.document = result.document;
        }, closeReason => {
            this.documentEditChangeMonitor.reset();
            if (closeReason == 'deleted') this.deselect();
        });

        if (doc.resource.id) detailModal.showDeleteButton();
        detailModal.setDocument(doc);
    }

}

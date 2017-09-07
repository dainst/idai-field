import {Component, OnInit} from '@angular/core';
import {ActivatedRoute,Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Datastore} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {ImageComponentBase} from './image-component-base';
import {Imagestore} from '../imagestore/imagestore';
import {DoceditComponent} from '../docedit/docedit.component';
import {ViewUtility} from '../util/view-utility';

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
        private documentEditChangeMonitor: DocumentEditChangeMonitor,
        private viewUtility: ViewUtility
    ) {
        super(route, datastore, imagestore, messages);
    }

    ngOnInit() {

        this.fetchDocAndImage();
        window.getSelection().removeAllRanges();
    }

    public jumpToRelationTarget(documentToJumpTo: IdaiFieldDocument) {

        this.viewUtility.getViewNameForDocument(documentToJumpTo)
            .then(viewName => this.router.navigate(['resources', viewName, documentToJumpTo.resource.id,
                'view', 'images']));
    }

    public deselect() {

        this.router.navigate(['images']);
    }

    public startEdit(doc: IdaiFieldDocument) {

        var detailModalRef = this.modalService.open(DoceditComponent, {size: 'lg', backdrop: 'static'});
        var detailModal = detailModalRef.componentInstance;

        detailModalRef.result.then(result => {
            if (result.document) this.image.document = result.document;
        }, closeReason => {
            this.documentEditChangeMonitor.reset();
            if (closeReason == 'deleted') this.deselect();
        });

        detailModal.setDocument(doc);
    }

}

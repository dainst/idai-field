import {Component, OnInit, ViewChild, TemplateRef} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {ReadDatastore} from "idai-components-2/datastore";
import {ImageComponentBase} from "./image-component-base";
import {Messages} from "idai-components-2/messages";
import {Mediastore} from "../datastore/mediastore";
import {DomSanitizer} from "@angular/platform-browser";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {ImageEditCanDeactivateGuard} from './image-edit-can-deactivate-guard';

@Component({
    moduleId: module.id,
    templateUrl: './image-edit-navigation.html'
})

/**
 * @author Daniel de Oliveira
 */
export class ImageEditNavigationComponent extends ImageComponentBase implements OnInit {

    @ViewChild('modalTemplate')
    private modalTemplate: TemplateRef<any>;
    private modal: NgbModalRef;
    
    constructor(
        private router: Router,
        private modalService:NgbModal,
        private canDeactivateGuard:ImageEditCanDeactivateGuard,
        route: ActivatedRoute,
        datastore: ReadDatastore,
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        messages: Messages
    ) {
        super(route,datastore,mediastore,sanitizer,messages);
    }

    ngOnInit() {
        this.fetchDocAndImage();
    }

    public onSaveSuccess(e) {
        console.debug("on save success",e)
    }

    public navigateBack() {
        this.router.navigate(['images',this.image.document.resource.id,'show']);
    }
    
    public showModal() {
        this.modal = this.modalService.open(this.modalTemplate);
    }
    
    public discard() {
        console.log("discard")
    }
}

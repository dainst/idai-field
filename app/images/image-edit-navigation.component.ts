import {Component, OnInit, ViewChild, TemplateRef} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {ReadDatastore} from "idai-components-2/datastore";
import {ImageComponentBase} from "./image-component-base";
import {IndexeddbDatastore} from '../datastore/indexeddb-datastore';
import {Messages} from "idai-components-2/messages";
import {Mediastore} from "idai-components-2/datastore";
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

    private idbDatastore;

    constructor(
        private router: Router,
        private modalService:NgbModal,
        private canDeactivateGuard:ImageEditCanDeactivateGuard,
        route: ActivatedRoute,
        datastore: IndexeddbDatastore,
        mediastore: Mediastore,
        sanitizer: DomSanitizer,
        messages: Messages
    ) {
        super(route,<ReadDatastore>datastore,mediastore,sanitizer,messages);
        this.idbDatastore = datastore;
    }

    ngOnInit() {
        this.fetchDocAndImage();
    }

    public navigate(proceed) {
        if (proceed) return this.canDeactivateGuard.proceed();
        
        this.router.navigate(['images',this.image.document.resource.id,'show']);
    }
    
    public showModal() {
        this.modal = this.modalService.open(this.modalTemplate);
    }
    
    public discard() {
        this.idbDatastore.refresh(this.image.document.resource.id).then(
            restoredObject => {
                this.canDeactivateGuard.proceed();
            },
            err => { console.error("error while refreshing document") }
        );
    }
}

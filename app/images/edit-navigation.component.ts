import {Component, OnInit, ViewChild, TemplateRef} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Datastore} from "idai-components-2/datastore";
import {Imagestore} from "../imagestore/imagestore";
import {ImageComponentBase} from "./image-component-base";
import {Messages} from "idai-components-2/messages";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {EditCanDeactivateGuard} from "./edit-can-deactivate-guard";
import {EditNavigation} from "../common/edit-navigation";

@Component({
    moduleId: module.id,
    templateUrl: './edit-navigation.html'
})

/**
 * Handles the navigation for the resource edit workflow
 * by managing all the interaction between the document edit
 * form, a deactivate guard and a save options modal.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditNavigationComponent
    extends ImageComponentBase 
    implements EditNavigation, OnInit {

    @ViewChild('modalTemplate')
    modalTemplate: TemplateRef<any>;
    modal: NgbModalRef;

    private activeTab: string;

    constructor(
        private router: Router,
        private modalService: NgbModal,
        private canDeactivateGuard: EditCanDeactivateGuard,
        route: ActivatedRoute,
        datastore: Datastore,
        imagestore: Imagestore,
        messages: Messages
    ) {
        super(route, datastore, imagestore, messages);
    }

    ngOnInit() {
        this.setActiveTab();
        this.fetchDocAndImage();
    }

    private setActiveTab() {

        this.route.params.forEach((params: Params) => {

            if (params['tab']) {
                this.activeTab = params['tab'];
            } else {
                this.activeTab = 'fields';
            }
        });
    }

    public navigate(savedViaSaveButton: boolean = false) {
        if (!savedViaSaveButton) return this.canDeactivateGuard.proceed();
        
        this.router.navigate(['images', this.image.document.resource.id, 'show']);
    }
    
    public showModal() {
        this.modal = this.modalService.open(this.modalTemplate);
    }
    
    public discard() {
        this.datastore.refresh(this.image.document).then(
            () => {
                this.canDeactivateGuard.proceed();
            },
            err => { console.error("error while refreshing document") }
        );
    }

    public goBack() {
        this.router.navigate(['/images/', this.image.document.resource.id, 'show']);
    }
}

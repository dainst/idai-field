import {Component, OnInit, ViewChild, TemplateRef} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {DocumentEditChangeMonitor} from "idai-components-2/documents";
import {Messages} from "idai-components-2/messages";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {ResourceEditCanDeactivateGuard} from "./resource-edit-can-deactivate-guard";
import {ResourcesComponent} from "./resources.component";
import {EditNavigation} from '../common/edit-navigation';

@Component({
    moduleId: module.id,
    templateUrl: './resource-edit-navigation.html'
})

/**
 * Handles the navigation for the resource edit workflow
 * by managing all the interaction between the document edit
 * form, a deactivate guard and a save options modal.
 * 
 * @author Daniel de Oliveira
 */
export class ResourceEditNavigationComponent
    implements  EditNavigation, OnInit {

    @ViewChild('modalTemplate')
    private modalTemplate: TemplateRef<any>;
    private modal: NgbModalRef;

    constructor(
        private overviewComponent: ResourcesComponent,
        private route: ActivatedRoute,
        private router: Router,
        private messages: Messages,
        private modalService:NgbModal,
        private canDeactivateGuard:ResourceEditCanDeactivateGuard,
        private documentEditChangeMonitor:DocumentEditChangeMonitor
    ) {
    }

    public showModal() {
        this.modal = this.modalService.open(this.modalTemplate);
    }

    private document: any;
    public mode: string; // new | edit

    private getRouteParams(callbackWithType, callbackWithId) {
        this.route.params.forEach((params: Params) => {

            if (params['id']) return callbackWithId(params['id']);
            if (params['type']) return callbackWithType(params['type']);
            
            console.error("there should be either an id or a type")
        });
    }

    ngOnInit() {
        this.getRouteParams(
            (type) => {
                this.mode = 'new';
                this.document = this.overviewComponent.createNewDocument(type);
            },
            (id) => {
                if (id == 'selected') {
                    this.mode = 'new';
                    this.document = this.overviewComponent.getSelected();

                } else {
                    this.mode = 'edit';
                    this.overviewComponent.loadDoc(id).then(
                        document => this.document = document);
                }
            }
        );
    }

    public goBack() {
        this.router.navigate(['resources', { id: this.document.resource.id }]);
    }

    /**
     * Discards changes of the document. Depending on whether it is a new or existing
     * object, it will either restore it or remove it from the list.
     */
    public discard(calledFromDeactivateGuard:boolean = false) {

        this.overviewComponent.restore().then(
            () => {
                this.documentEditChangeMonitor.reset();
                if (!calledFromDeactivateGuard) this.canDeactivateGuard.proceed();
            }, (err) => {
                this.messages.add(err);
            });
    }

    /**
     * According to the current mode or the value of savedViaSaveButton,
     * initiates an appropriate route change.
     */
    public navigate(savedViaSaveButton:boolean = false) {

        if (!savedViaSaveButton) return this.canDeactivateGuard.proceed();

        if (this.mode=='new') {
            this.router.navigate(['resources',this.document.resource.id,'edit']);

            // since ngOnInit will not get triggered
            this.mode='edit';
            // doc must be reloaded so instance of this.document is
            // the same as the one in overviewComponent
            this.overviewComponent.loadDoc(this.document.resource.id).then(
                document=>this.document=document);
        }

    }
}
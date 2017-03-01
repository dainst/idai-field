import {Component, OnInit, ViewChild, TemplateRef} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {DocumentEditChangeMonitor} from "idai-components-2/documents";
import {Messages} from "idai-components-2/messages";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {EditCanDeactivateGuard} from "./edit-can-deactivate-guard";
import {ResourcesComponent} from "./resources.component";
import {EditNavigation} from '../common/edit-navigation';

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
 */
export class EditNavigationComponent
    implements  EditNavigation, OnInit {

    @ViewChild('modalTemplate')
    modalTemplate: TemplateRef<any>;
    modal: NgbModalRef;

    constructor(
        private resourcesComponent: ResourcesComponent,
        private route: ActivatedRoute,
        private router: Router,
        private messages: Messages,
        private modalService:NgbModal,
        private canDeactivateGuard:EditCanDeactivateGuard,
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
                this.resourcesComponent.createNewDocument(type).then(doc=>{
                    this.document = doc;
                })
            },
            (id) => {
                if (id == 'selected') {
                    this.mode = 'new';
                    this.document = this.resourcesComponent.getSelected();

                } else {
                    this.mode = 'edit';
                    this.resourcesComponent.loadDoc(id).then(
                        document => this.document = document);
                }
            }
        );
    }

    public goBack() {
        this.router.navigate(['resources', { id: this.document.resource.id }]);
    }

    public goToOverview() {
        this.resourcesComponent.fetchDocuments();
        this.router.navigate(['resources']);
    }

    /**
     * Discards changes of the document. Depending on whether it is a new or existing
     * object, it will either restore it or remove it from the list.
     */
    public discard() {
        this.restore().then(()=>{
            this.canDeactivateGuard.proceed();
        });
    }

    public restore() : Promise<any> {
        return new Promise<any>((resolve,reject)=>{
            this.resourcesComponent.restore().then(
                () => {
                    this.documentEditChangeMonitor.reset();
                    resolve();
                }, (err) => {
                    this.messages.add(err);
                    reject();
                });
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
            this.resourcesComponent.loadDoc(this.document.resource.id).then(
                document=>this.document=document);
        }
    }
}
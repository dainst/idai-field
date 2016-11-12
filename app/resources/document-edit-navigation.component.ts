import {Component, OnInit, ViewChild, TemplateRef} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {Messages, DocumentEditChangeMonitor} from "idai-components-2/idai-components-2";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {DocumentEditCanDeactivateGuard} from "./document-edit-can-deactivate-guard";
import {ResourcesComponent} from "./resources.component";

@Component({
    moduleId: module.id,
    templateUrl: './document-edit-navigation.html'
})

/**
 * Handles
 * <ul>
 *   <li>loading or creating of the document to edit
 *   <li>showing the document edit form and provision it with the document to edit
 *   <li>validation and persistence of the document edited
 *   <li>the navigation away from document edit
 * </ul>
 *
 * Regarding the navigation: If the documents state is marked as edited
 * but not saved, on trying to navigate to other routes, the user
 * gets presented a modal which offers choices to save or abandon the
 * changes or to cancel the navigation.
 *
 * @author Daniel de Oliveira
 */
export class DocumentEditNavigationComponent implements  OnInit {

    @ViewChild('modalTemplate')
    private modalTemplate: TemplateRef<any>;
    private modal: NgbModalRef;

    constructor(
        private overviewComponent: ResourcesComponent,
        private route: ActivatedRoute,
        private router: Router,
        private messages: Messages,
        private modalService:NgbModal,
        private canDeactivateGuard:DocumentEditCanDeactivateGuard,
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

    public onSaveSuccess(e) {
        this.navigate(e['document'], e['proceed']);
    }

    public onBackButtonClicked() {
        this.router.navigate(['resources', { id: this.document.resource.id }]);
    }

    /**
     * Discards changes of the document. Depending on whether it is a new or existing
     * object, it will either restore it or remove it from the list.
     *
     * @param proceed proceed with canDeactivateGuard.proceed() if <code>true</code>.
     */
    public discard(proceed:boolean=false) {

        this.overviewComponent.restore().then(
            () => {
                this.documentEditChangeMonitor.reset();
                if (proceed) this.canDeactivateGuard.proceed();
            }, (err) => {
                this.messages.add(err);
            });
    }

    /**
     * According to the current mode or the value of proceed,
     * initiates an appropriate route change.
     *
     * @param doc
     * @param proceed
     */
    private navigate(doc, proceed) {

        if (proceed) return this.canDeactivateGuard.proceed();

        if (this.mode=='new') {
            this.router.navigate(['resources',doc.resource.id,'edit']);

            // since ngOnInit will not get triggered
            this.mode='edit';
            // doc must be reloaded so instance of this.document is
            // the same as the one in overviewComponent
            this.overviewComponent.loadDoc(doc.resource.id).then(
                document=>this.document=document);
        }

    }
}
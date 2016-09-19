import {Component, OnInit, ViewChild, TemplateRef} from "@angular/core";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {PersistenceManager, Messages, DocumentEditChangeMonitor} from "idai-components-2/idai-components-2";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {CanDeactivateGuard} from "./can-deactivate-guard";
import {M} from "../m";
import {Validator} from "../model/validator";
import {OverviewComponent} from "./overview.component";
import {IdaiFieldDocument} from "../model/idai-field-document";

@Component({
    moduleId: module.id,
    templateUrl: '../../templates/document-edit-wrapper.html'
})

/**
 * @author Daniel de Oliveira
 */
export class DocumentEditWrapperComponent implements  OnInit {

    @ViewChild('modalTemplate')
    private modalTemplate: TemplateRef<any>;
    private modal: NgbModalRef;

    constructor(
        private overviewComponent: OverviewComponent,
        private route: ActivatedRoute,
        private router: Router,
        private messages: Messages,
        private modalService:NgbModal,
        private canDeactivateGuard:CanDeactivateGuard,
        private persistenceManager:PersistenceManager,
        private validator: Validator,
        private documentEditChangeMonitor:DocumentEditChangeMonitor
    )
    {}

    public showModal() {
        this.modal = this.modalService.open(this.modalTemplate);
    }

    private document: any;
    public mode: string; // new | edit

    ngOnInit() {
        this.route.params.forEach((params: Params) => {
            if (params['id'].indexOf('new')!=-1) {
                this.mode='new';
                this.document=this.overviewComponent.createNewDocument();
            } else {
                this.mode='edit';
                this.overviewComponent.loadDoc(params['id']).then(
                    document=>this.document=document);
            }
        });
    }



    /**
     * @param proceed proceed with canDeactivateGuard.proceed() if <code>true</code>.
     */
    public save(proceed:boolean=false) {

        var doc=this.overviewComponent.getSelected();

        var validationReport = this.validator.validate(<IdaiFieldDocument>doc);
        if (!validationReport.valid) {
            return this.messages.add(validationReport.errorMessage, validationReport.errorData);
        }

        doc['synced'] = 0;

        this.persistenceManager.persist(doc).then(
            () => {
                this.documentEditChangeMonitor.reset();
                if (proceed)
                    this.canDeactivateGuard.proceed();
                else if (this.mode=='new') {
                    this.router.navigate(['resources',doc.resource.id,'edit']);
                    this.mode='edit';
                    this.overviewComponent.loadDoc(doc.resource.id).then(
                        document=>this.document=document);
                }
                // show message after route change
                this.messages.add(M.OVERVIEW_SAVE_SUCCESS);
            },
            errors => {
                for (var err of errors) {
                    this.messages.add(err);
                }
            });
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
}
import {Component, OnInit, ViewChild, TemplateRef} from "@angular/core";
import {ActivatedRoute, Params,Router} from "@angular/router";
import {ReadDatastore} from "idai-components-2/idai-components-2";
import {ObjectList} from "./object-list";
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {CanDeactivateGuard} from './can-deactivate-quard';
import {PersistenceManager} from "idai-components-2/idai-components-2";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {M} from "../m";
import {Messages} from "idai-components-2/idai-components-2";
import {Validator} from "../model/validator";
import {DocumentEditChangeMonitor} from "idai-components-2/idai-components-2";

@Component({
    moduleId: module.id,
    templateUrl: '../../templates/document-edit-wrapper.html'
})

/**
 * @author Daniel de Oliveira
 */
export class DocumentEditWrapperComponent implements  OnInit{

    @ViewChild('modalTemplate')
    private modalTemplate: TemplateRef<any>;
    private modal: NgbModalRef;

    constructor(
        private datastore: ReadDatastore,
        private route: ActivatedRoute,
        private router: Router,
        private messages: Messages,
        private objectList: ObjectList,
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
        console.log("on init")

        this.route.params.forEach((params: Params) => {
            if (params['id'].indexOf('new')!=-1) {
                this.mode='new';
                this.document=this.objectList.createNewDocument();
            } else {
                this.mode='edit';
                this.datastore.get(params['id']).then(document=> {
                    this.document = document;
                    this.objectList.setSelected(document);
                })
            }
        });
    }

    public cancel(proceed:boolean=false) {
        if (proceed)
            this.canDeactivateGuard.cancel();
        else
            this.router.navigate(['resources',this.document.resource.id])
    }

    public save(proceed:boolean=false) {

        var doc=this.objectList.getSelected();

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
                else if (this.mode='new')
                    this.router.navigate(['resources',doc.resource.id]);
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
     * @param document
     */
    public discard(proceed:boolean=false) {

        this.objectList.restore().then(
            restoredDocument => {
                this.documentEditChangeMonitor.reset();
                if (proceed) this.canDeactivateGuard.proceed();
            }, (err) => {
                this.messages.add(err);
            });
    }


}
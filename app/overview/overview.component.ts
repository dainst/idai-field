import {Component, OnInit, Inject, ViewChild, TemplateRef} from '@angular/core';
import {Router} from '@angular/router';
import {IdaiFieldDocument} from '../model/idai-field-document';
import {ObjectList} from "./object-list";
import {Messages} from "idai-components-2/idai-components-2";
import {M} from "../m";
import {DocumentEditChangeMonitor} from "idai-components-2/idai-components-2";
import {Validator} from "../model/validator";
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {PersistenceService} from "./persistence-service";

@Component({
    moduleId: module.id,
    templateUrl: '../../templates/overview.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class OverviewComponent implements OnInit {

    /**     
     * The object currently selected in the list and shown in the edit component.
     */
    private selectedDocument: IdaiFieldDocument;
    
    private editMode: boolean;

    @ViewChild('modalTemplate')
    private modalTemplate: TemplateRef<any>;

    private modal: NgbModalRef;

    constructor(@Inject('app.config') private config,
        private objectList: ObjectList,
        private messages: Messages,
        private documentEditChangeMonitor:DocumentEditChangeMonitor,
        private validator:Validator,
        private persistenceService:PersistenceService,
        private modalService:NgbModal,
        private router: Router) {
    }

    /**
     * Function to call if preconditions to change are met.
     */
    private changeSelectionAllowedCallback;

    /**
     * Checks if the preconditions are given to change the focus from
     * <code>currentlySelectedDocument</code> to another object.
     *
     * @param currentlySelectedDocument the document which is still selected,
     *   but will be unselected if a change of selection is allowed
     * @returns {any}
     */
    private checkChangeSelectionAllowed(currentlySelectedDocument) {

        this.messages.clear();
        if (!this.documentEditChangeMonitor.isChanged()) {

            return this.persistenceService.discardChanges();
        }
        this.modal = this.modalService.open(this.modalTemplate);
    }

    

    private registerSelectionCallbackForExisting(documentToSelect) {
        return function() {
            this.objectList.setSelected(documentToSelect);
            this.router.navigate(['resources',documentToSelect['resource']['id']]);
        }.bind(this);
    }

    private registerSelectionCallbackForNew() {
        return function() {
            this.router.navigate(['resources','new','edit'])
        }.bind(this);
    }

    /**
     * @param documentToSelect the object that should get selected if the preconditions
     *   to change the selection are met.
     *   undefined if a new object is to be created if the preconditions
     *   to change the selection are met.
     */
    public select(documentToSelect: IdaiFieldDocument) {

        if (documentToSelect) {
            if (documentToSelect == this.objectList.getSelected()) return;
            this.persistenceService.setChangeSelectionAllowedCallback(this.registerSelectionCallbackForExisting(documentToSelect));
        }
        else {
            this.router.navigate(['resources']); // to make sure onInit runs again in documentView
            this.persistenceService.setChangeSelectionAllowedCallback(this.registerSelectionCallbackForNew());
        }

        this.checkChangeSelectionAllowed(this.selectedDocument);
    }

    public ngOnInit() {

        if (this.config.environment == "test") {
            setTimeout(() => this.objectList.fetchAllDocuments(), 500);
        } else {
            this.objectList.fetchAllDocuments();
        }
    }

    onKey(event:any) {
        this.objectList.fetchSomeDocuments(event.target.value);
    }
}

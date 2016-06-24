import {Component, OnInit, Inject, Input, OnChanges, Output, EventEmitter, ChangeDetectorRef, ViewChild} from '@angular/core';
import {Datastore} from 'idai-components-2/idai-components-2';
import {Document} from 'idai-components-2/idai-components-2';
import {DocumentEditComponent} from "idai-components-2/idai-components-2";
import {AppComponent} from "../components/app.component";
import {Project} from "../model/project";
import {Messages} from "idai-components-2/idai-components-2";
import {ConfigLoader} from "idai-components-2/idai-components-2";
import {LoadAndSaveService} from "idai-components-2/idai-components-2";
import {MODAL_DIRECTIVES, ModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';

@Component({
    templateUrl: 'templates/overview.html',
    directives: [DocumentEditComponent, MODAL_DIRECTIVES],
})

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class OverviewComponent implements OnInit {

    @ViewChild('modal')
    modal: ModalComponent;

    /**
     * The object currently selected in the list and shown in the edit component.
     */
    private selectedDocument: Document;

    constructor(private datastore: Datastore,
        @Inject('app.config') private config,
        private project: Project,
        private configLoader: ConfigLoader,
        private messages: Messages,
        private loadAndSaveService:LoadAndSaveService) {
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
        if (!this.loadAndSaveService.isChanged()) 
            return this.discardChanges(currentlySelectedDocument);
        this.modal.open();
    }

    public save(object) {
        this.loadAndSaveService.save(object).then(()=>true);
        this.changeSelectionAllowedCallback();
    }


    /**
     * Discards changes of the document. Depending on whether it is a new or existing
     * object, it will either restore it or remove it from the list.
     *
     * @param document
     */
    public discardChanges(document) {

        this.project.restore(document).then(() => {
            this.loadAndSaveService.changed=false; // TODO this should be done with a setter.
            this.changeSelectionAllowedCallback();
        }, (err) => {
            this.messages.add(err);
        });
    }

    private setConfigs() {
        this.configLoader.setProjectConfiguration(AppComponent.PROJECT_CONFIGURATION_PATH);
        this.configLoader.setRelationsConfiguration(AppComponent.RELATIONS_CONFIGURATION_PATH);
    }

    private createSelectExistingCallback(documentToSelect) {
        return function() {
            this.selectedDocument=documentToSelect;
        }.bind(this);
    }

    private createNewObjectCallback() {
        console.log("create createNewObjectCallback")
        return function() {
            console.log("insideCreateNewObjectCallback")

            var newDocument = {"resource":{}};
            this.project.getDocuments().unshift(newDocument);
            this.selectedDocument = <Document> newDocument;
        }.bind(this);
    }

    /**
     * @param documentToSelect the object that should get selected if the precondtions
     *   to change the selection are met.
     *   undefined if a new object is to be created if the preconditions
     *   to change the selection are met.
     */
    public select(documentToSelect: Document) {

        if (documentToSelect) {
            if (documentToSelect == this.selectedDocument) return;
            this.changeSelectionAllowedCallback=this.createSelectExistingCallback(documentToSelect);
        }
        else this.changeSelectionAllowedCallback=this.createNewObjectCallback();

        this.checkChangeSelectionAllowed(this.selectedDocument);
    }

    public ngOnInit() {
        this.setConfigs();
        if (this.config.environment == "test") {
            setTimeout(() => this.fetchDocuments(), 500);
        } else {
            this.fetchDocuments();
        }
    }

    onKey(event:any) {

        if (event.target.value == "") {
            this.datastore.all({}).then(documents => {
                this.project.setDocuments(documents);
            }).catch(err => console.error(err));
        } else {
            this.datastore.find(event.target.value, {}).then(documents => {
                this.project.setDocuments(documents);
            }).catch(err => console.error(err));
        }
    }

    private fetchDocuments() {

        this.datastore.all({}).then(documents => {
            this.project.setDocuments(documents);
        }).catch(err => console.error(err));
    }

    public saveWithButton() {
        this.loadAndSaveService.save(this.selectedDocument).then(()=>{},err=>{});
    }
}

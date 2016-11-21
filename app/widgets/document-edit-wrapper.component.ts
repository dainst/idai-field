import {Component, Input, Output, EventEmitter} from "@angular/core";
import {
    PersistenceManager,
    DocumentEditChangeMonitor,
    ConfigLoader,
    WithConfiguration
} from "idai-components-2/documents";
import {Messages} from "idai-components-2/messages";
import {M} from "../m";
import {Validator} from "../model/validator";
import {IdaiFieldDocument} from "../model/idai-field-document";


@Component({
    selector: 'document-edit-wrapper',
    moduleId: module.id,
    templateUrl: './document-edit-wrapper.html'
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
export class DocumentEditWrapperComponent extends WithConfiguration {

    @Input() document;
    @Input() showBackButton : boolean = true;
    @Output() onSaveSuccess = new EventEmitter<any>();
    @Output() onBackButtonClicked = new EventEmitter<any>();

    constructor(
        private messages: Messages,
        private persistenceManager:PersistenceManager,
        private validator: Validator,
        private documentEditChangeMonitor:DocumentEditChangeMonitor,
        configLoader: ConfigLoader
    ) {
        super(configLoader);
    }

    public save(viaSaveButton:boolean=false) {

        var validationReport = this.validate(this.document);
        if (!validationReport.valid) {
            console.debug("validation report",validationReport);
            return this.messages.addWithParams([validationReport.errorMessage].concat(validationReport.errorData));
        }

        this.persistenceManager.persist(this.document).then(
            () => {
                this.document['synced'] = 0;
                this.documentEditChangeMonitor.reset();

                this.onSaveSuccess.emit(viaSaveButton);
                // this.navigate(this.document, proceed);
                // show message after route change
                this.messages.add(M.OVERVIEW_SAVE_SUCCESS);
            },
            errors => {
                for (var err of errors) {
                    this.messages.add(err);
                }
            });
    }

    private validate(doc) {
        return this.validator.validate(<IdaiFieldDocument>doc);
    }

    public getTypeLabel(): string {

        if (!this.document) {
            return "";
        } else {
            return this.projectConfiguration.getLabelForType(this.document.resource.type);
        }
    }
}
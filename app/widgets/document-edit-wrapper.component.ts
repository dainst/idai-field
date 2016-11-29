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
 * Uses the document edit form of idai-components-2 and adds styling
 * and save and back buttons. The save button is used to save and
 * validate the document.
 *
 * @author Daniel de Oliveira
 */
export class DocumentEditWrapperComponent extends WithConfiguration {

    @Input() document: IdaiFieldDocument;
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

        var validationReport = this.validator.validate(
            <IdaiFieldDocument>this.document);
        if (!validationReport.valid) {
            return this.messages.addWithParams(
                [validationReport.errorMessage]
                .concat(validationReport.errorData));
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
}
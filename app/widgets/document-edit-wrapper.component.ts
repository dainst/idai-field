import {Component, Input, Output, EventEmitter} from "@angular/core";
import {DocumentEditChangeMonitor} from "idai-components-2/documents";
import {Messages} from "idai-components-2/messages";
import {WithConfiguration, ConfigLoader} from "idai-components-2/configuration";
import {M} from "../m";
import {Validator, PersistenceManager} from "idai-components-2/persist";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ImagePickerComponent} from "./image-picker.component";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";


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
    @Input() showBackButton: boolean = true;
    @Output() onSaveSuccess = new EventEmitter<any>();
    @Output() onBackButtonClicked = new EventEmitter<any>();

    constructor(
        private messages: Messages,
        private persistenceManager: PersistenceManager,
        private validator: Validator,
        private documentEditChangeMonitor:DocumentEditChangeMonitor,
        configLoader: ConfigLoader,
        private modalService: NgbModal

    ) {
        super(configLoader);
    }

    public save(viaSaveButton: boolean = false) {

        var validationError = this.validator.validate(
            <IdaiFieldDocument>this.document);
        if (validationError) return this.messages.addWithParams(validationError);

        this.document['synced'] = 0;
        this.persistenceManager.persist(this.document).then(
            () => {
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

    public openImagePicker() {

        this.modalService.open(ImagePickerComponent, {size: "lg"}).result.then(
            (selectedImages: IdaiFieldImageDocument[]) => {
                this.addDepictedInRelations(selectedImages);
                this.documentEditChangeMonitor.setChanged();
            }, (closeReason) => {}
        );
    }

    private addDepictedInRelations(imageDocuments: IdaiFieldImageDocument[]) {

        var relations = this.document.resource.relations["depictedIn"]
            ? this.document.resource.relations["depictedIn"].slice() : [];

        for (let i in imageDocuments) {
            if (relations.indexOf(imageDocuments[i].resource.id) == -1) {
                relations.push(imageDocuments[i].resource.id);
            }
        }

        this.document.resource.relations["depictedIn"] = relations;
    }
}
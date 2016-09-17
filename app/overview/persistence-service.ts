import {Injectable} from "@angular/core";
import {DocumentEditChangeMonitor} from "idai-components-2/idai-components-2";
import {PersistenceManager} from "idai-components-2/idai-components-2";
import {IdaiFieldDocument} from '../model/idai-field-document';
import {M} from "../m";
import {Messages} from "idai-components-2/idai-components-2";
import {ObjectList} from "./object-list";
import {Validator} from "../model/validator";
import {Router} from '@angular/router';

/**
 */
@Injectable()
export class PersistenceService {
    
    private changeSelectionAllowedCallback;
    
    public setChangeSelectionAllowedCallback(cb) {
        this.changeSelectionAllowedCallback=cb;
    }
    
    constructor(
        private persistenceManager:PersistenceManager,
        private documentEditChangeMonitor:DocumentEditChangeMonitor,
        private messages: Messages,
        private objectList:ObjectList,
        private validator:Validator) {
    }
    
    public save() {

        var doc=this.objectList.getSelected();

        var validationReport = this.validator.validate(<IdaiFieldDocument>doc);
        if (!validationReport.valid) {
            return this.messages.add(validationReport.errorMessage, validationReport.errorData);
        }

        doc['synced'] = 0;

        this.persistenceManager.persist(doc).then(
            () => {
                this.documentEditChangeMonitor.reset();
                this.changeSelectionAllowedCallback();
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
    public discardChanges() {

        this.objectList.restore().then(
            restoredDocument => {
                this.documentEditChangeMonitor.reset();
                this.changeSelectionAllowedCallback();

            }, (err) => {
                this.messages.add(err);
            });
    }
}
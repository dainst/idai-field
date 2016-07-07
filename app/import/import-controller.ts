import {Injectable, NgZone} from "@angular/core";
import {Messages, Utils} from "idai-components-2/idai-components-2";
import {Importer} from "./importer";
import {M} from "../m";


/**
 * Delegates calls to the Importer, waits for 
 * the import to finish and extracts the importReport
 * in order to generate appropriate messages to display
 * to the user.
 * 
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class ImportController {

    constructor(
        private messages: Messages,
        private zone: NgZone,
        private importer: Importer
    ) {}
    
    public importResourcesFromFile(filepath: string) {

        this.showStartMessage();
        this.zone.run(() => {});

        this.importer.importResourcesFromFile(filepath).then(
            importReport => {
                this.evaluate(importReport, filepath);
                this.zone.run(() => {});
            }
        );
    }

    private evaluate(importReport, filepath) {
        
        if (importReport['io_error'])
            this.messages.add(M.IMPORTER_FAILURE_FILEUNREADABLE, [filepath]);
        
        for (var lineNumber of importReport["invalid_json"])
            this.messages.add(M.IMPORTER_FAILURE_INVALIDJSON, [lineNumber]);

        for (var err of importReport['validation_errors'])
            this.showValidationErrorMessage(err.msg, err.msgParams);

        for (var err of importReport['datastore_errors'])
            this.showDatastoreErrorMessage(err.doc, err.msg);
        
        if (importReport['successful_imports'] > 0)
            this.showSuccessMessage(importReport['successful_imports']);
    }

    private showStartMessage() {

        this.messages.clear();
        this.messages.add(M.IMPORTER_START);
    }
    
    private showSuccessMessage(count) {

        if (count == 1) {
            this.messages.add(M.IMPORTER_SUCCESS_SINGLE);
        } else {
            this.messages.add(M.IMPORTER_SUCCESS_MULTIPLE, [count.toString()]);
        }
    }

    private showValidationErrorMessage(msg: string, msgParams: any[]) {

        if (msg == M.OBJLIST_IDMISSING) {
            this.messages.add(M.IMPORTER_FAILURE_IDMISSING);
        } else if (msg == M.VALIDATION_ERROR_INVALIDTYPE) {
            this.messages.add(M.IMPORTER_FAILURE_INVALIDTYPE, msgParams);
        } else if (msg == M.VALIDATION_ERROR_INVALIDFIELD) {
            this.messages.add(M.IMPORTER_FAILURE_INVALIDFIELD, msgParams);
        } else if (msg == M.VALIDATION_ERROR_INVALIDFIELDS) {
            this.messages.add(M.IMPORTER_FAILURE_INVALIDFIELDS, msgParams);
        }
    }

    private showDatastoreErrorMessage(doc: any, msg: any) {

        if (msg == M.OBJLIST_IDEXISTS) {
            this.messages.add(M.IMPORTER_FAILURE_IDEXISTS, [doc.resource.identifier]);
        } else {
            this.messages.add(M.IMPORTER_FAILURE_GENERICDATASTOREERROR, [doc.resource.identifier]);
        }
    }
}
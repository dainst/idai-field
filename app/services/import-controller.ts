import {Injectable, NgZone} from "@angular/core";
import {Messages, Datastore, Utils} from "idai-components-2/idai-components-2";
import {Importer} from "./importer";
import {M} from "../m";


/**
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

        this.importer.importResourcesFromFile(filepath).subscribe(
            (importReport)=>{
                console.debug("importReport: ",importReport);
                this.evaluate(importReport);
                this.zone.run(() => {});
            }
        );
    }

    private evaluate(importReport) {
        for (var lineNumber of importReport["invalid_json"])
            this.messages.add(M.IMPORTER_FAILURE_INVALIDJSON, [lineNumber]);

        if (importReport['successful_imports']>0)
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
}
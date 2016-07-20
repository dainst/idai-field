import {Component} from '@angular/core';
import {Messages} from "idai-components-2/idai-components-2";
import {Importer} from "./importer";
import {Reader} from "./reader";
import {FileSystemReader} from "./file-system-reader";
import {Parser} from "./parser";
import {NativeJsonlParser} from "./native-jsonl-parser";
import {M} from "../m";


@Component({
    templateUrl: 'templates/import.html'
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */

export class ImportComponent {

    private sourceType: string = "file";
    private format: string = "native";
    private file: File;

    constructor(
        private messages: Messages,
        private importer: Importer,
        private nativeJsonlParser: NativeJsonlParser
    ) {}

    public startImport() {

        this.messages.clear();

        var reader: Reader = this.createReader();
        var parser: Parser = this.chooseParser();

        if (!reader || !parser) {
            this.messages.add(M.IMPORTER_GENERIC_START_ERROR);
            return;
        }

        this.messages.add(M.IMPORTER_START);

        this.importer.importResources(reader, parser).then(
            importReport => {
                this.evaluate(importReport);
            }
        );
    }

    private createReader(): Reader {

        switch (this.sourceType) {
            case "file":
                return new FileSystemReader(this.file);
            case "http":
                // TODO Create & return http reader
                return null;
        }
    }

    private chooseParser(): Parser {

        switch (this.format) {
            case "native":
                return this.nativeJsonlParser;
            case "idig":
                // TODO return idig parser
                return null;
        }
    }

    private selectFile(event) {

        var files = event.target.files;

        if (!files || files.length == 0) {
            this.file = undefined;
        } else {
            this.file = files[0];
        }
    }
    
    private evaluate(importReport) {

        if (importReport['io_error']) {
            var filename = this.file ? this.file.name : "";
            this.messages.add(M.IMPORTER_FAILURE_FILEUNREADABLE, [filename]);
        }

        for (var lineNumber of importReport["invalid_json"])
            this.messages.add(M.IMPORTER_FAILURE_INVALIDJSON, [lineNumber]);

        for (var err of importReport['validation_errors'])
            this.showValidationErrorMessage(err.msg, err.msgParams);

        for (var err of importReport['datastore_errors'])
            this.showDatastoreErrorMessage(err.doc, err.msg);

        if (importReport['successful_imports'] > 0)
            this.showSuccessMessage(importReport['successful_imports']);
    }

    private showSuccessMessage(count) {

        if (count == 1) {
            this.messages.add(M.IMPORTER_SUCCESS_SINGLE);
        } else {
            this.messages.add(M.IMPORTER_SUCCESS_MULTIPLE, [count.toString()]);
        }
    }

    private showValidationErrorMessage(msg: string, msgParams: any[]) {

        if (msg == M.VALIDATION_ERROR_IDMISSING) {
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

        if (msg == M.DATASTORE_IDEXISTS) {
            this.messages.add(M.IMPORTER_FAILURE_IDEXISTS, [doc.resource.identifier]);
        } else {
            this.messages.add(M.IMPORTER_FAILURE_GENERICDATASTOREERROR, [doc.resource.identifier]);
        }
    }
}
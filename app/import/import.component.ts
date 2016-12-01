import {Component} from '@angular/core';
import {Messages} from "idai-components-2/messages";
import {Importer} from "./importer";
import {Reader} from "./reader";
import {FileSystemReader} from "./file-system-reader";
import {HttpReader} from "./http-reader";
import {Parser} from "./parser";
import {NativeJsonlParser} from "./native-jsonl-parser";
import {IdigCsvParser} from "./idig-csv-parser";
import {M} from "../m";
import {Http} from "@angular/http";


@Component({
    moduleId: module.id,
    templateUrl: './import.html'
})

/**
 * Delegates calls to the Importer, waits for
 * the import to finish and extracts the importReport
 * in order to generate appropriate messages to display
 * to the user.
 * 
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */

export class ImportComponent {

    private sourceType: string = "file";
    private format: string = "native";
    private file: File;
    private url: string;

    constructor(
        private messages: Messages,
        private importer: Importer,
        private nativeJsonlParser: NativeJsonlParser,
        private idigCsvParser: IdigCsvParser,
        private http: Http
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

    public isReady(): boolean {

        switch (this.sourceType) {
            case "file":
                return (this.file != undefined);
            case "http":
                return (this.url != undefined);
        }
    }

    public reset(): void {

        this.messages.clear();

        this.file = undefined;
        this.url = undefined;
    }

    private createReader(): Reader {

        switch (this.sourceType) {
            case "file":
                return new FileSystemReader(this.file);
            case "http":
                return new HttpReader(this.url,this.http);
        }
    }

    private chooseParser(): Parser {

        switch (this.format) {
            case "native":
                return this.nativeJsonlParser;
            case "idig":
                return this.idigCsvParser;
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
            this.messages.addWithParams([M.IMPORTER_FAILURE_FILEUNREADABLE, filename]);
        }

        for (var parserError of importReport["parser_errors"])
            this.messages.addWithParams([parserError.message, parserError.lineNumber, parserError.errorData]);

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
            this.messages.addWithParams([M.IMPORTER_SUCCESS_MULTIPLE, count.toString()]);
        }
    }

    private showValidationErrorMessage(msg: string, msgParams: string[]) {

        if (msgParams.length>0)
            this.messages.addWithParams([msg].concat(msgParams));

        // if (msg == M.VALIDATION_ERROR_IDMISSING) {
        //     this.messages.add(M.IMPORTER_FAILURE_IDMISSING);
        // } else if (msg == M.VALIDATION_ERROR_INVALIDTYPE) {
        //     this.messages.addWithParams([M.IMPORTER_FAILURE_INVALIDTYPE].concat(msgParams));
        // } else if (msg == M.VALIDATION_ERROR_INVALIDFIELD) {
        //     this.messages.addWithParams([M.IMPORTER_FAILURE_INVALIDFIELD].concat(msgParams));
        // } else if (msg == M.VALIDATION_ERROR_INVALIDFIELDS) {
        //     this.messages.addWithParams([M.IMPORTER_FAILURE_INVALIDFIELDS].concat(msgParams));
        // }
    }

    private showDatastoreErrorMessage(doc: any, msg: any) {

        if (msg == M.DATASTORE_IDEXISTS) {
            this.messages.addWithParams([M.IMPORTER_FAILURE_IDEXISTS, doc.resource.identifier]);
        } else {
            this.messages.addWithParams([M.IMPORTER_FAILURE_GENERICDATASTOREERROR, doc.resource.identifier]);
        }
    }
}
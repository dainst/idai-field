import {Component} from "@angular/core";
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
import {DefaultImportStrategy} from "./default-import-strategy";
import {Datastore} from "idai-components-2/datastore";
import {Validator} from "idai-components-2/persist";
import {ImportStrategy} from "./import-strategy";


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
        private datastore: Datastore,
        private validator: Validator,
        private http: Http
    ) {}

    public startImport() {

        let reader = ImportComponent.createReader(this.sourceType,this.file,this.url,this.http);
        let parser = ImportComponent.createParser(this.format);
        let importStrategy = ImportComponent.createImportStrategy(this.validator,this.datastore);

        this.messages.clear();
        if (!reader || !parser || !importStrategy) return this.messages.add(M.IMPORTER_GENERIC_START_ERROR);

        this.messages.add(M.IMPORTER_START);
        this.importer.importResources(reader, parser, importStrategy)
            .then(importReport => this.evaluate(importReport))

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

    private static createImportStrategy(validator, datastore): ImportStrategy {
        return new DefaultImportStrategy(validator, datastore)
    }

    private static createReader(sourceType, file, url, http): Reader {

        switch (sourceType) {
            case "file":
                return new FileSystemReader(file);
            case "http":
                return new HttpReader(url, http);
        }
    }

    private static createParser(format): Parser {

        switch (format) {
            case "native":
                return new NativeJsonlParser();
            case "idig":
                return new IdigCsvParser();
        }
    }

    public selectFile(event) {

        let files = event.target.files;

        if (!files || files.length == 0) {
            this.file = undefined;
        } else {
            this.file = files[0];
        }
    }
    
    private evaluate(importReport) {

        if (importReport['io_error']) {
            let filename = this.file ? this.file.name : '';
            this.messages.addWithParams([M.IMPORTER_FAILURE_FILEUNREADABLE, filename]);
        }
        for (let msgWithParams of importReport['errors']) {

            this.messages.addWithParams(msgWithParams);
        }
        for (let parserInfo of importReport['parser_info'])
            this.messages.add(parserInfo);

        this.showSuccessMessage(importReport['successful_imports']);
    }

    private showSuccessMessage(count) {

        if (count == 1) {
            this.messages.add(M.IMPORTER_SUCCESS_SINGLE);
        } else if (count > 1) {
            this.messages.addWithParams([M.IMPORTER_SUCCESS_MULTIPLE, count.toString()]);
        }
    }
}
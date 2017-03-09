import {Component} from "@angular/core";
import {Messages} from "idai-components-2/messages";
import {Importer, ImportReport} from "./importer";
import {Reader} from "./reader";
import {FileSystemReader} from "./file-system-reader";
import {HttpReader} from "./http-reader";
import {Parser} from "./parser";
import {NativeJsonlParser} from "./native-jsonl-parser";
import {IdigCsvParser} from "./idig-csv-parser";
import {GeojsonParser} from "./geojson-parser";
import {M} from "../m";
import {Http} from "@angular/http";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";
import {Validator} from "idai-components-2/persist";
import {ImportStrategy} from "./import-strategy";
import {DefaultImportStrategy} from "./default-import-strategy";
import {MergeGeometriesImportStrategy} from "./merge-geometries-import-strategy";
import {RollbackStrategy} from "./rollback-strategy";
import {DefaultRollbackStrategy} from "./default-rollback-strategy";
import {NoRollbackStrategy} from "./no-rollback-strategy";


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
    private running: boolean = false;

    constructor(
        private messages: Messages,
        private importer: Importer,
        private datastore: IdaiFieldDatastore,
        private validator: Validator,
        private http: Http
    ) {}

    public startImport() {

        let reader: Reader = ImportComponent.createReader(this.sourceType, this.file, this.url, this.http);
        let parser: Parser = ImportComponent.createParser(this.format);
        let importStrategy: ImportStrategy
            = ImportComponent.createImportStrategy(this.format, this.validator, this.datastore);
        let rollbackStrategy: RollbackStrategy
            = ImportComponent.createRollbackStrategy(this.format, this.datastore);

        this.messages.clear();
        if (!reader || !parser || !importStrategy || !rollbackStrategy) {
            return this.messages.add([M.IMPORTER_GENERIC_START_ERROR]);
        }

        this.messages.add([M.IMPORTER_START]);
        this.running = true;
        this.importer.importResources(reader, parser, importStrategy)
            .then(importReport => this.finishImport(importReport, rollbackStrategy))
            .then(() => this.running = false);
    }

    private finishImport(importReport: ImportReport, rollbackStrategy: RollbackStrategy) {

        if (importReport.errors.length > 0) {
            rollbackStrategy.rollback(importReport.importedResourcesIds).then(
                () => {
                    this.showMessages(importReport.errors);
                }, err => {
                    this.showMessages(importReport.errors);
                    this.messages.add([M.IMPORTER_FAILURE_ROLLBACKERROR]);
                    console.error(err);
                }
            );
        } else {
            this.showMessages(importReport.warnings);
            this.showSuccessMessage(importReport.importedResourcesIds);
        }
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

    private static createImportStrategy(format: string, validator: Validator,
                                        datastore: IdaiFieldDatastore): ImportStrategy {

        switch (format) {
            case "native":
                return new DefaultImportStrategy(validator, datastore);
            case "idig":
                return new DefaultImportStrategy(validator, datastore);
            case "geojson":
                return new MergeGeometriesImportStrategy(datastore);
        }
    }

    private static createRollbackStrategy(format: string, datastore: IdaiFieldDatastore): RollbackStrategy {

        switch (format) {
            case "native":
                return new DefaultRollbackStrategy(datastore);
            case "idig":
                return new DefaultRollbackStrategy(datastore);
            case "geojson":
                return new NoRollbackStrategy();
        }
    }

    private static createReader(sourceType: string, file: File, url: string, http: Http): Reader {

        switch (sourceType) {
            case "file":
                return new FileSystemReader(file);
            case "http":
                return new HttpReader(url, http);
        }
    }

    private static createParser(format: string): Parser {

        switch (format) {
            case "native":
                return new NativeJsonlParser();
            case "idig":
                return new IdigCsvParser();
            case "geojson":
                return new GeojsonParser();
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

    private showSuccessMessage(importedResourcesIds: string[]) {

        if (importedResourcesIds.length == 1) {
            this.messages.add([M.IMPORTER_SUCCESS_SINGLE]);
        } else if (importedResourcesIds.length > 1) {
            this.messages.add([M.IMPORTER_SUCCESS_MULTIPLE, importedResourcesIds.length.toString()]);
        }
    }

    private showMessages(messages: string[][]) {

        for (let msgWithParams of messages) {
            this.messages.add(msgWithParams);
        }
    }
}
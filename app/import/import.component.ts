import {Component} from '@angular/core';
import {Http} from '@angular/http';
import {Document} from 'idai-components-2/core';
import {Messages} from 'idai-components-2/messages';
import {Validator} from 'idai-components-2/persist';
import {ConfigLoader} from 'idai-components-2/configuration';
import {Importer, ImportReport} from './importer';
import {Reader} from './reader';
import {FileSystemReader} from './file-system-reader';
import {HttpReader} from './http-reader';
import {Parser} from './parser';
import {NativeJsonlParser} from './native-jsonl-parser';
import {IdigCsvParser} from './idig-csv-parser';
import {GeojsonParser} from './geojson-parser';
import {M} from '../m';
import {CachedPouchdbDatastore} from '../datastore/cached-pouchdb-datastore';
import {ImportStrategy} from './import-strategy';
import {DefaultImportStrategy} from './default-import-strategy';
import {MergeGeometriesImportStrategy} from './merge-geometries-import-strategy';
import {RelationsStrategy} from './relations-strategy';
import {DefaultRelationsStrategy} from './default-relations-strategy';
import {NoRelationsStrategy} from './no-relations-strategy';
import {RollbackStrategy} from './rollback-strategy';
import {DefaultRollbackStrategy} from './default-rollback-strategy';
import {NoRollbackStrategy} from './no-rollback-strategy';
import {RelationsCompleter} from './relations-completer';
import {SettingsService} from '../settings/settings-service';
import {ViewUtility} from '../util/view-utility';


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

    public sourceType: string = 'file';
    public format: string = 'native';
    public file: File;
    public url: string;
    public running: boolean = false;
    public mainTypeDocuments: Array<Document> = [];
    public mainTypeDocumentId: string = '';

    constructor(
        private messages: Messages,
        private importer: Importer,
        private datastore: CachedPouchdbDatastore,
        private validator: Validator,
        private http: Http,
        private relationsCompleter: RelationsCompleter,
        private settingsService: SettingsService,
        private configLoader: ConfigLoader,
        private viewUtility: ViewUtility
    ) {
        this.viewUtility.getMainTypeDocuments().then(
            documents => this.mainTypeDocuments = documents,
            msgWithParams => messages.add(msgWithParams)
        );
    }

    public startImport() {

        let reader: Reader = ImportComponent.createReader(this.sourceType, this.file, this.url, this.http);
        let parser: Parser = ImportComponent.createParser(this.format);
        let importStrategy: ImportStrategy = ImportComponent.createImportStrategy(this.format, this.validator,
            this.datastore, this.settingsService, this.configLoader, this.mainTypeDocumentId);
        let relationsStrategy: RelationsStrategy
            = ImportComponent.createRelationsStrategy(this.format, this.relationsCompleter);
        let rollbackStrategy: RollbackStrategy
            = ImportComponent.createRollbackStrategy(this.format, this.datastore);

        this.messages.clear();
        if (!reader || !parser || !importStrategy || !rollbackStrategy) {
            return this.messages.add([M.IMPORT_GENERIC_START_ERROR]);
        }

        this.messages.add([M.IMPORT_START]);
        this.running = true;
        this.importer.importResources(reader, parser, importStrategy, relationsStrategy, rollbackStrategy,
                this.datastore)
            .then(importReport => this.showImportResult(importReport))
            .then(() => { this.running = false; });
    }

    public isReady(): boolean {

        switch (this.sourceType) {
            case 'file':
                return (this.file != undefined);
            case 'http':
                return (this.url != undefined);
        }
    }

    public reset(): void {

        this.messages.clear();

        this.file = undefined;
        this.url = undefined;
    }

    private static createImportStrategy(format: string, validator: Validator, datastore: CachedPouchdbDatastore,
                                        settingsService: SettingsService, configLoader: ConfigLoader,
                                        mainTypeDocumentId: string): ImportStrategy {

        switch (format) {
            case 'native':
                return new DefaultImportStrategy(validator, datastore, settingsService, configLoader,
                    mainTypeDocumentId);
            case 'idig':
                return new DefaultImportStrategy(validator, datastore, settingsService, configLoader);
            case 'geojson':
                return new MergeGeometriesImportStrategy(validator, datastore, settingsService);
        }
    }

    private static createRelationsStrategy(format: string, relationsCompleter: RelationsCompleter): RelationsStrategy {

        switch (format) {
            case 'native':
                return new DefaultRelationsStrategy(relationsCompleter);
            case 'idig':
                return new DefaultRelationsStrategy(relationsCompleter);
            case 'geojson':
                return new NoRelationsStrategy();
        }
    }

    private static createRollbackStrategy(format: string, datastore: CachedPouchdbDatastore): RollbackStrategy {

        switch (format) {
            case 'native':
                return new DefaultRollbackStrategy(datastore);
            case 'idig':
                return new DefaultRollbackStrategy(datastore);
            case 'geojson':
                return new NoRollbackStrategy();
        }
    }

    private static createReader(sourceType: string, file: File, url: string, http: Http): Reader {

        switch (sourceType) {
            case 'file':
                return new FileSystemReader(file);
            case 'http':
                return new HttpReader(url, http);
        }
    }

    private static createParser(format: string): Parser {

        switch (format) {
            case 'native':
                return new NativeJsonlParser();
            case 'idig':
                return new IdigCsvParser();
            case 'geojson':
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

    private showImportResult(importReport: ImportReport) {

        if (importReport.errors.length > 0) {
            this.showMessages(importReport.errors);
        } else {
            this.showMessages(importReport.warnings);
            this.showSuccessMessage(importReport.importedResourcesIds);
        }
    }

    private showSuccessMessage(importedResourcesIds: string[]) {

        if (importedResourcesIds.length == 1) {
            this.messages.add([M.IMPORT_SUCCESS_SINGLE]);
        } else if (importedResourcesIds.length > 1) {
            this.messages.add([M.IMPORT_SUCCESS_MULTIPLE, importedResourcesIds.length.toString()]);
        }
    }

    private showMessages(messages: string[][]) {

        for (let msgWithParams of messages) {
            this.messages.add(msgWithParams);
        }
    }
}
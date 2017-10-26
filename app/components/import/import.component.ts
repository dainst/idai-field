import {Component} from '@angular/core';
import {Http} from '@angular/http';
import {Document} from 'idai-components-2/core';
import {Messages} from 'idai-components-2/messages';
import {Validator} from 'idai-components-2/persist';
import {ConfigLoader} from 'idai-components-2/configuration';
import {Importer, ImportReport} from '../../core/importer/importer';
import {Reader} from '../../core/importer/reader';
import {FileSystemReader} from '../../core/importer/file-system-reader';
import {HttpReader} from '../../core/importer/http-reader';
import {Parser} from '../../core/importer/parser';
import {NativeJsonlParser} from '../../core/importer/native-jsonl-parser';
import {IdigCsvParser} from '../../core/importer/idig-csv-parser';
import {GeojsonParser} from '../../core/importer/geojson-parser';
import {M} from '../../m';
import {CachedPouchdbDatastore} from '../../core/datastore/cached-pouchdb-datastore';
import {ImportStrategy} from '../../core/importer/import-strategy';
import {DefaultImportStrategy} from '../../core/importer/default-import-strategy';
import {MergeGeometriesImportStrategy} from '../../core/importer/merge-geometries-import-strategy';
import {RelationsStrategy} from '../../core/importer/relations-strategy';
import {DefaultRelationsStrategy} from '../../core/importer/default-relations-strategy';
import {NoRelationsStrategy} from '../../core/importer/no-relations-strategy';
import {RollbackStrategy} from '../../core/importer/rollback-strategy';
import {DefaultRollbackStrategy} from '../../core/importer/default-rollback-strategy';
import {NoRollbackStrategy} from '../../core/importer/no-rollback-strategy';
import {RelationsCompleter} from '../../core/importer/relations-completer';
import {SettingsService} from '../../core/settings/settings-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UploadModalComponent} from './upload-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';


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
    public file: File|undefined;
    public url: string|undefined;
    public mainTypeDocuments: Array<Document> = [];
    public mainTypeDocumentId: string = '';

    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);


    constructor(
        private messages: Messages,
        private importer: Importer,
        private datastore: CachedPouchdbDatastore,
        private validator: Validator,
        private http: Http,
        private relationsCompleter: RelationsCompleter,
        private settingsService: SettingsService,
        private configLoader: ConfigLoader,
        private viewFacade: ViewFacade,
        private modalService: NgbModal
    ) {
        this.viewFacade.getAllOperationSubtypeWithViewDocuments().then(
            documents => this.mainTypeDocuments = documents,
            msgWithParams => messages.add(msgWithParams)
        );
    }

    public startImport() {

        const reader: Reader|undefined = ImportComponent.createReader(this.sourceType, this.file as any, this.url as any, this.http);
        const parser: Parser|undefined = ImportComponent.createParser(this.format);
        const importStrategy: ImportStrategy|undefined = ImportComponent.createImportStrategy(this.format, this.validator,
            this.datastore, this.settingsService, this.configLoader, this.mainTypeDocumentId);
        const relationsStrategy: RelationsStrategy|undefined
            = ImportComponent.createRelationsStrategy(this.format, this.relationsCompleter);
        const rollbackStrategy: RollbackStrategy|undefined
            = ImportComponent.createRollbackStrategy(this.format, this.datastore);

        this.messages.clear();
        if (!reader || !parser || !importStrategy || !rollbackStrategy) {
            return this.messages.add([M.IMPORT_GENERIC_START_ERROR]);
        }

        let uploadModalRef: any = undefined;
        let uploadReady = false;
        setTimeout(() => {
            if (!uploadReady) uploadModalRef = this.modalService.open(UploadModalComponent, { backdrop: 'static', keyboard: false });
        }, 200);
        this.importer.importResources(reader, parser, importStrategy, relationsStrategy as any, rollbackStrategy, this.datastore)
            .then(importReport => {
                uploadReady = true;
                if(uploadModalRef) uploadModalRef.close();
                this.showImportResult(importReport)
            });
    }


    public isReady(): boolean|undefined {

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
                                        mainTypeDocumentId: string): ImportStrategy|undefined {

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

    private static createRelationsStrategy(format: string, relationsCompleter: RelationsCompleter): RelationsStrategy|undefined {

        switch (format) {
            case 'native':
                return new DefaultRelationsStrategy(relationsCompleter);
            case 'idig':
                return new DefaultRelationsStrategy(relationsCompleter);
            case 'geojson':
                return new NoRelationsStrategy();
        }
    }

    private static createRollbackStrategy(format: string, datastore: CachedPouchdbDatastore): RollbackStrategy|undefined {

        switch (format) {
            case 'native':
                return new DefaultRollbackStrategy(datastore);
            case 'idig':
                return new DefaultRollbackStrategy(datastore);
            case 'geojson':
                return new NoRollbackStrategy();
        }
    }


    public selectFile(event: any) {

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


    private static createReader(sourceType: string, file: File, url: string, http: Http): Reader|undefined {

        switch (sourceType) {
            case 'file':
                return new FileSystemReader(file);
            case 'http':
                return new HttpReader(url, http);
        }
    }


    private static createParser(format: string): Parser|undefined {

        switch (format) {
            case 'native':
                return new NativeJsonlParser();
            case 'idig':
                return new IdigCsvParser();
            case 'geojson':
                return new GeojsonParser();
        }
    }
}
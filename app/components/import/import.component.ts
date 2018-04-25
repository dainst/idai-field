import {Component} from '@angular/core';
import {Http} from '@angular/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Document} from 'idai-components-2/core';
import {Messages} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {Import, ImportReport} from '../../core/import/import';
import {Reader} from '../../core/import/reader';
import {FileSystemReader} from '../../core/import/file-system-reader';
import {HttpReader} from '../../core/import/http-reader';
import {Parser} from '../../core/import/parser';
import {NativeJsonlParser} from '../../core/import/native-jsonl-parser';
import {IdigCsvParser} from '../../core/import/idig-csv-parser';
import {GeojsonParser} from '../../core/import/geojson-parser';
import {M} from '../../m';
import {ImportStrategy} from '../../core/import/import-strategy';
import {DefaultImportStrategy} from '../../core/import/default-import-strategy';
import {MergeGeometriesImportStrategy} from '../../core/import/merge-geometries-import-strategy';
import {RelationsStrategy} from '../../core/import/relations-strategy';
import {DefaultRelationsStrategy} from '../../core/import/default-relations-strategy';
import {NoRelationsStrategy} from '../../core/import/no-relations-strategy';
import {RollbackStrategy} from '../../core/import/rollback-strategy';
import {DefaultRollbackStrategy} from '../../core/import/default-rollback-strategy';
import {NoRollbackStrategy} from '../../core/import/no-rollback-strategy';
import {RelationsCompleter} from '../../core/import/relations-completer';
import {SettingsService} from '../../core/settings/settings-service';
import {UploadModalComponent} from './upload-modal.component';
import {ViewFacade} from '../resources/state/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {RemoteChangesStream} from '../../core/datastore/core/remote-changes-stream';
import {Validator} from '../../core/model/validator';
import {MeninxCsvParser} from '../../core/import/meninx-csv-parser';


type ImportFormat = 'native' | 'idig' | 'geojson' | 'meninxfind';

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
    public format: ImportFormat = 'native';
    public file: File|undefined;
    public url: string|undefined;
    public mainTypeDocuments: Array<Document> = [];
    public mainTypeDocumentId?: string;

    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);


    constructor(
        private messages: Messages,
        private datastore: DocumentDatastore,
        private remoteChangesStream: RemoteChangesStream,
        private validator: Validator,
        private http: Http,
        private settingsService: SettingsService,
        private projectConfiguration: ProjectConfiguration,
        private viewFacade: ViewFacade,
        private modalService: NgbModal
    ) {
        this.viewFacade.getAllOperationSubtypeWithViewDocuments().then(
            documents => this.mainTypeDocuments = documents,
            msgWithParams => messages.add(msgWithParams)
        );
    }

    
    public async startImport() {

        // this.messages.removeAllMessages();

        const reader: Reader|undefined = ImportComponent.createReader(this.sourceType, this.file as any,
            this.url as any, this.http);
        if (!reader) return this.messages.add([M.IMPORT_GENERIC_START_ERROR]);

        let uploadModalRef: any = undefined;
        let uploadReady = false;
        setTimeout(() => {
            if (!uploadReady) uploadModalRef = this.modalService.open(UploadModalComponent,
                { backdrop: 'static', keyboard: false });
        }, 200);

        this.remoteChangesStream.setAutoCacheUpdate(false);
        const importReport = await Import.go(
            reader,
            ImportComponent.createParser(this.format),
            ImportComponent.createImportStrategy(this.format,
                this.validator, this.datastore, this.settingsService, this.projectConfiguration, this.mainTypeDocumentId),
            ImportComponent.createRelationsStrategy(this.format, new RelationsCompleter(this.datastore, this.projectConfiguration)),
            ImportComponent.createRollbackStrategy(this.format, this.datastore));
        this.remoteChangesStream.setAutoCacheUpdate(true);

        uploadReady = true;
        if(uploadModalRef) uploadModalRef.close();
        this.showImportResult(importReport);
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

        this.messages.removeAllMessages();
        this.file = undefined;
        this.url = undefined;
    }


    public selectFile(event: any) {

        const files = event.target.files;
        this.file = (!files || files.length == 0)
            ? undefined
            : files[0];
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

        if (importedResourcesIds.length === 1) {
            this.messages.add([M.IMPORT_SUCCESS_SINGLE]);
        } else if (importedResourcesIds.length > 1) {
            this.messages.add([M.IMPORT_SUCCESS_MULTIPLE, importedResourcesIds.length.toString()]);
        }
    }


    private showMessages(messages: string[][]) {

        messages.forEach(msgWithParams => this.messages.add(msgWithParams));
    }


    private static createReader(sourceType: string, file: File, url: string, http: Http): Reader|undefined {

        switch (sourceType) {
            case 'file':
                return new FileSystemReader(file);
            case 'http':
                return new HttpReader(url, http);
        }
    }


    private static createParser(format: ImportFormat): Parser {

        switch (format) {
            case 'meninxfind':
                return new MeninxCsvParser();
            case 'idig':
                return new IdigCsvParser();
            case 'geojson':
                return new GeojsonParser();
            default: // 'native'
                return new NativeJsonlParser();
        }
    }


    private static createImportStrategy(format: ImportFormat, validator: Validator, datastore: DocumentDatastore,
                                        settingsService: SettingsService, projectConfiguration: ProjectConfiguration,
                                        mainTypeDocumentId?: string): ImportStrategy {

        switch (format) {
            case 'meninxfind':
                return new DefaultImportStrategy(validator, datastore, projectConfiguration, settingsService.getUsername());
            case 'idig':
                return new DefaultImportStrategy(validator, datastore, projectConfiguration, settingsService.getUsername());
            case 'geojson':
                return new MergeGeometriesImportStrategy(validator, datastore, settingsService.getUsername());
            default: // 'native'
                return new DefaultImportStrategy(validator, datastore, projectConfiguration, settingsService.getUsername(),
                    mainTypeDocumentId);
        }
    }


    private static createRelationsStrategy(format: ImportFormat, relationsCompleter: RelationsCompleter): RelationsStrategy {

        switch (format) {
            case 'meninxfind':
                return new NoRelationsStrategy();
            case 'idig':
                return new DefaultRelationsStrategy(relationsCompleter);
            case 'geojson':
                return new NoRelationsStrategy();
            default: // 'native'
                return new DefaultRelationsStrategy(relationsCompleter);
        }
    }


    private static createRollbackStrategy(format: ImportFormat, datastore: DocumentDatastore): RollbackStrategy {

        switch (format) {
            case 'idig':
                return new DefaultRollbackStrategy(datastore);
            case 'geojson':
                return new NoRollbackStrategy();
            default: // 'native'
                return new DefaultRollbackStrategy(datastore);
        }
    }
}
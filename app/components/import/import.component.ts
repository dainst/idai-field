import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {flow, filter, map, isNot, empty, take} from 'tsfun';
import {Document, Messages, ProjectConfiguration} from 'idai-components-2';
import {ImportReport} from '../../core/import/import-facade';
import {Reader} from '../../core/import/reader/reader';
import {FileSystemReader} from '../../core/import/reader/file-system-reader';
import {HttpReader} from '../../core/import/reader/http-reader';
import {UploadModalComponent} from './upload-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {RemoteChangesStream} from '../../core/datastore/core/remote-changes-stream';
import {UsernameProvider} from '../../core/settings/username-provider';
import {SettingsService} from '../../core/settings/settings-service';
import {MessagesConversion} from './messages-conversion';
import {M} from '../m';
import {ImportFacade, ImportFormat} from '../../core/import/import-facade';
import {ShapefileFileSystemReader} from '../../core/import/reader/shapefile-filesystem-reader';
import {JavaToolExecutor} from '../../common/java-tool-executor';
import {ImportValidator} from '../../core/import/exec/import-validator';
import {IdGenerator} from '../../core/datastore/core/id-generator';


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
export class ImportComponent implements OnInit {

    public sourceType: string = 'file';
    public format: ImportFormat = 'native';
    public file: File|undefined;
    public url: string|undefined;
    public mainTypeDocuments: Array<Document> = [];
    public mainTypeDocumentId: string = ''; // no assignment to a mainType
    public allowMergingExistingResources = false;
    public javaInstalled: boolean = true;


    constructor(
        private messages: Messages,
        private datastore: DocumentDatastore,
        private remoteChangesStream: RemoteChangesStream,
        private importValidator: ImportValidator,
        private http: HttpClient,
        private usernameProvider: UsernameProvider,
        private projectConfiguration: ProjectConfiguration,
        private viewFacade: ViewFacade,
        private modalService: NgbModal,
        private settingsService: SettingsService,
        private idGenerator: IdGenerator
    ) {
        this.viewFacade.getAllOperations().then(
            documents => this.mainTypeDocuments = documents,
            msgWithParams => messages.add(msgWithParams)
        );
    }


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);

    public getProject = () => this.settingsService.getSelectedProject();

    public isJavaInstallationMissing = () => this.format === 'shapefile' && !this.javaInstalled;


    async ngOnInit() {

        this.javaInstalled = await JavaToolExecutor.isJavaInstalled();
    }


    public onFormatChange() {

        if (this.format === 'shapefile' && this.sourceType === 'http') this.sourceType = 'file';
    }


    public async startImport() {

        const reader: Reader|undefined = ImportComponent.createReader(this.sourceType, this.format,
            this.file as any, this.url as any, this.http);
        if (!reader) return this.messages.add([M.IMPORT_ERROR_GENERIC_START_ERROR]);

        let uploadModalRef: any = undefined;
        let uploadReady = false;
        setTimeout(() => {
            if (!uploadReady) uploadModalRef = this.modalService.open(UploadModalComponent,
                { backdrop: 'static', keyboard: false });
        }, 200);

        this.remoteChangesStream.setAutoCacheUpdate(false);
        const importReport = await ImportFacade.doImport(
            this.format,
            this.importValidator,
            this.datastore,
            this.usernameProvider,
            this.projectConfiguration,
            this.mainTypeDocumentId,
            this.allowMergingExistingResources,
            await reader.go(),
            () => this.idGenerator.generateId()
        );
        this.remoteChangesStream.setAutoCacheUpdate(true);

        uploadReady = true;
        if(uploadModalRef) uploadModalRef.close();
        this.showImportResult(importReport);
    }


    public isReady(): boolean|undefined {

        return this.sourceType === 'file'
            ? this.file !== undefined
            : this.url !== undefined;
    }
    

    public reset(): void {

        this.messages.removeAllMessages();
        this.file = undefined;
        this.url = undefined;
    }


    public selectFile(event: any) {

        const files = event.target.files;
        this.file = !files || files.length === 0
            ? undefined
            : files[0];
    }


    public getFileInputExtensions(): string {

        switch (this.format) {
            case 'native':
                return '.jsonl';
            case 'idig':
            case 'meninxfind':
                return '.csv';
            case 'geojson-gazetteer':
            case 'geojson':
                return '.geojson,.json';
            case 'shapefile':
                return '.shp';
        }
    }


    private showImportResult(importReport: ImportReport) {

        if (importReport.errors.length > 0) return this.showMessages(importReport.errors);

        this.showMessages(importReport.warnings);
        this.showSuccessMessage(importReport.successfulImports);
    }


    private showSuccessMessage(successfulImports: number) {

        if (successfulImports === 1) {
            this.messages.add([M.IMPORT_SUCCESS_SINGLE]);
        } else if (successfulImports > 1) {
            this.messages.add([M.IMPORT_SUCCESS_MULTIPLE, successfulImports.toString()]);
        }
    }


    private showMessages(messages: string[][]) {

        flow(messages,
            map(MessagesConversion.convertMessage),
            filter(isNot(empty)),
            take(1))
            .forEach((msgWithParams: any) => this.messages.add(msgWithParams));
    }


    private static createReader(sourceType: string, format: string, file: File, url: string,
                                http: HttpClient): Reader|undefined {

        return sourceType === 'file'
            ? format === 'shapefile'
                ? new ShapefileFileSystemReader(file)
                : new FileSystemReader(file)
            : new HttpReader(url, http);
    }
}
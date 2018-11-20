import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {isNot, empty} from 'tsfun';
import {Document, Messages, ProjectConfiguration} from 'idai-components-2';
import {ImportReport} from '../../core/import/import';
import {Reader} from '../../core/import/reader';
import {FileSystemReader} from '../../core/import/file-system-reader';
import {HttpReader} from '../../core/import/http-reader';
import {UploadModalComponent} from './upload-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {RemoteChangesStream} from '../../core/datastore/core/remote-changes-stream';
import {Validator} from '../../core/model/validator';
import {UsernameProvider} from '../../core/settings/username-provider';
import {SettingsService} from '../../core/settings/settings-service';
import {MessagesConversion} from './messages-conversion';
import {M} from '../m';
import {ImportFacade, ImportFormat} from '../../core/import/import-facade';
import {ShapefileFileSystemReader} from '../../core/import/shapefile-filesystem-reader';
import {JavaToolExecutor} from '../../widgets/java-tool-executor';


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
    public mainTypeDocumentId?: string;
    public allowMergingExistingResources = false;
    public javaInstalled: boolean = true;


    constructor(
        private messages: Messages,
        private datastore: DocumentDatastore,
        private remoteChangesStream: RemoteChangesStream,
        private validator: Validator,
        private http: HttpClient,
        private usernameProvider: UsernameProvider,
        private projectConfiguration: ProjectConfiguration,
        private viewFacade: ViewFacade,
        private modalService: NgbModal,
        private settingsService: SettingsService
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
            this.validator,
            this.datastore,
            this.usernameProvider,
            this.projectConfiguration,
            this.mainTypeDocumentId,
            this.allowMergingExistingResources,
            reader
        );
        this.remoteChangesStream.setAutoCacheUpdate(true);

        uploadReady = true;
        if(uploadModalRef) uploadModalRef.close();
        this.showImportResult(importReport);
    }


    public isReady(): boolean|undefined {

        return this.sourceType === 'file'
            ? this.file != undefined
            : this.url != undefined;
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

        messages
            .map(MessagesConversion.convertMessage)
            .filter(isNot(empty))
            .forEach(msgWithParams => this.messages.add(msgWithParams));
    }


    private static createReader(sourceType: string, format: string, file: File, url: string,
                                http: HttpClient): Reader|undefined {

        return sourceType === 'file'
            ? format === 'shapefile' ? new ShapefileFileSystemReader(file) : new FileSystemReader(file)
            : new HttpReader(url, http);
    }
}
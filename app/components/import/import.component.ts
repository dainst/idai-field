import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {IdaiType} from '../../core/configuration/model/idai-type';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {empty, filter, flow, forEach, includedIn, isNot, map, take} from 'tsfun';
import {Document, Messages} from 'idai-components-2';
import {Importer, ImportReport} from '../../core/import/importer';
import {Reader} from '../../core/import/reader/reader';
import {FileSystemReader} from '../../core/import/reader/file-system-reader';
import {HttpReader} from '../../core/import/reader/http-reader';
import {UploadModalComponent} from './upload-modal.component';
import {ModelUtil} from '../../core/model/model-util';
import {ChangesStream} from '../../core/datastore/core/changes-stream';
import {UsernameProvider} from '../../core/settings/username-provider';
import {SettingsService} from '../../core/settings/settings-service';
import {MessagesConversion} from './messages-conversion';
import {M} from '../messages/m';
import {ShapefileFileSystemReader} from '../../core/import/reader/shapefile-filesystem-reader';
import {JavaToolExecutor} from '../../java-tool-executor';
import {ImportValidator} from '../../core/import/import/process/import-validator';
import {IdGenerator} from '../../core/datastore/core/id-generator';
import {TypeUtility} from '../../core/model/type-utility';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {ExportRunner} from '../../core/export/export-runner';
import {ImportState} from './import-state';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {AngularUtility} from '../../angular/angular-utility';
import BASE_EXCLUSION = ExportRunner.BASE_EXCLUSION;
import {TabManager} from '../../core/tabs/tab-manager';
import getTypesWithoutExcludedTypes = ExportRunner.getTypesWithoutExcludedTypes;
import {ViewFacade} from '../../core/resources/view/view-facade';


@Component({
    moduleId: module.id,
    templateUrl: './import.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
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

    public url: string|undefined;
    public operations: Array<Document> = [];
    public javaInstalled: boolean = true;
    public running: boolean = false;


    constructor(
        private messages: Messages,
        private datastore: DocumentDatastore,
        private remoteChangesStream: ChangesStream,
        private importValidator: ImportValidator,
        private http: HttpClient,
        private usernameProvider: UsernameProvider,
        private projectConfiguration: ProjectConfiguration,
        private viewFacade: ViewFacade,
        private modalService: NgbModal,
        private settingsService: SettingsService,
        private idGenerator: IdGenerator,
        private typeUtility: TypeUtility,
        private tabManager: TabManager,
        public importState: ImportState) {

        this.resetOperationIfNecessary();
    }


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);

    public isJavaInstallationMissing = () => this.importState.format === 'shapefile' && !this.javaInstalled;

    public showMergeOption = () => this.importState.format === 'native' || this.importState.format === 'csv';

    public showPermitDeletionsOption = () => includedIn(['native', 'csv'])(this.importState.format) && this.importState.mergeMode;

    public showImportIntoOperation = () => (this.importState.format === 'native' || this.importState.format === 'csv') && !this.importState.mergeMode;

    public getSeparator = () => this.importState.getSeparator();

    public setSeparator = (separator: string) => this.importState.setSeparator(separator);


    async ngOnInit() {

        this.operations = await this.fetchOperations();
        this.updateResourceTypes();
        this.javaInstalled = await JavaToolExecutor.isJavaInstalled();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') await this.tabManager.openActiveTab();
    }


    public onFormatChange() {

        if (this.importState.format === 'shapefile' && this.importState.sourceType === 'http') this.importState.sourceType = 'file';
    }


    public async onImportButtonClick() {

        if (!this.isReady()) return;

        this.running = true;
        await AngularUtility.refresh(100);
        await this.startImport();

        // The timeout is necessary to prevent another import from starting if the import button is clicked
        // again while the import is running
        setTimeout(() => this.running = false, 100);
    }


    public isReady(): boolean|undefined {

        return !this.running
            && this.importState.sourceType === 'file'
                ? this.importState.file !== undefined
                : this.url !== undefined;
    }
    

    public reset(): void {

        this.messages.removeAllMessages();
        this.importState.file = undefined;
        this.url = undefined;
    }


    public selectFile(event: any) {

        this.importState.typeFromFileName = false;

        const files = event.target.files;
        this.importState.file = !files || files.length === 0
            ? undefined
            : files[0];

        if (this.importState.file) {
            this.importState.selectedType = this.getResourceTypeFromFileName(this.importState.file.name);
            if (this.importState.selectedType) {
                this.importState.typeFromFileName = true;
            } else {
                this.selectFirstResourceType();
            }
        }
    }


    public getFileInputExtensions(): string {

        switch (this.importState.format) {
            case 'native':
                return '.jsonl';
            case 'geojson-gazetteer':
            case 'geojson':
                return '.geojson,.json';
            case 'shapefile':
                return '.shp';
            case 'csv':
                return '.csv';
        }
    }


    private async resetOperationIfNecessary() {

        if (!this.importState.selectedOperationId) return;

        try {
            await this.datastore.get(this.importState.selectedOperationId);
        } catch {
            this.importState.selectedOperationId = '';
        }
    }


    private async startImport() {

        this.messages.removeAllMessages();

        const reader: Reader|undefined = ImportComponent.createReader(this.importState.sourceType, this.importState.format,
            this.importState.file as any, this.url as any, this.http);
        if (!reader) return this.messages.add([M.IMPORT_READER_GENERIC_START_ERROR]);

        let uploadModalRef: any = undefined;
        let uploadReady = false;
        setTimeout(() => {
            if (!uploadReady) uploadModalRef = this.modalService.open(UploadModalComponent,
                { backdrop: 'static', keyboard: false });
        }, 200);

        this.settingsService.stopSync();
        const importReport = await this.doImport(reader);
        this.settingsService.startSync();

        uploadReady = true;
        if(uploadModalRef) uploadModalRef.close();
        this.showImportResult(importReport);
    }


    private updateResourceTypes() {

        this.importState.resourceTypes = getTypesWithoutExcludedTypes(
            this.projectConfiguration.getTypesList(), this.getTypesToExclude()
        );

        if (!this.importState.selectedType || !this.importState.resourceTypes.includes(this.importState.selectedType)) {
            this.selectFirstResourceType();
        }
    }


    private getTypesToExclude() {

        return this.importState.mergeMode
            ? BASE_EXCLUSION
            : BASE_EXCLUSION.concat(this.typeUtility.getImageTypeNames());
    }


    private async doImport(reader: Reader) {

        return Importer.doImport(
            this.importState.format,
            this.typeUtility,
            this.datastore,
            this.usernameProvider,
            this.projectConfiguration,
            this.importState.selectedOperationId,
            this.importState.mergeMode,
            this.importState.permitDeletions,
            await reader.go(),
            () => this.idGenerator.generateId(),
            this.importState.format === 'csv' ? this.importState.selectedType : undefined,
            this.importState.format === 'csv' ? this.getSeparator() : undefined);
    }


    private showImportResult(importReport: ImportReport) {

        if (importReport.errors.length > 0) return this.showMessages(importReport.errors);
        if (importReport.successfulImports === 0) return this.showEmptyImportWarning();
        this.showSuccessMessage(importReport.successfulImports);
    }


    private showEmptyImportWarning() {

        this.messages.add([M.IMPORT_WARNING_EMPTY]);
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
            take(1),
            forEach((msgWithParams: any) => this.messages.add(msgWithParams)));
    }


    private async fetchOperations(): Promise<Array<Document>> {

        try {
            return (await this.datastore.find({
                types: this.typeUtility.getOperationTypeNames()
            })).documents;
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
            return [];
        }
    }


    private getResourceTypeFromFileName(fileName: string): IdaiType|undefined {

        for (let segment of fileName.split('.')) {
            const type: IdaiType|undefined = this.projectConfiguration.getTypesList()
                .find(type => type.name.toLowerCase() === segment.toLowerCase());
            if (type) return type;
        }

        return undefined;
    }


    private selectFirstResourceType() {

        if (this.importState.resourceTypes.length > 0) this.importState.selectedType = this.importState.resourceTypes[0];
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
import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {empty, filter, flow, includedIn, isNot, map, take, forEach} from 'tsfun';
import {Document} from 'idai-components-2';
import {Importer, ImportFormat, ImportReport} from '../../core/import/importer';
import {Category} from '../../core/configuration/model/category';
import {Reader} from '../../core/import/reader/reader';
import {FileSystemReader} from '../../core/import/reader/file-system-reader';
import {HttpReader} from '../../core/import/reader/http-reader';
import {UploadModalComponent} from './upload-modal.component';
import {ModelUtil} from '../../core/model/model-util';
import {ChangesStream} from '../../core/datastore/changes/changes-stream';
import {UsernameProvider} from '../../core/settings/username-provider';
import {SyncService} from '../../core/sync/sync-service';
import {MessagesConversion} from './messages-conversion';
import {M} from '../messages/m';
import {ShapefileFileSystemReader} from '../../core/import/reader/shapefile-filesystem-reader';
import {JavaToolExecutor} from '../../core/java/java-tool-executor';
import {ImportValidator} from '../../core/import/import/process/import-validator';
import {IdGenerator} from '../../core/datastore/pouchdb/id-generator';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {ExportRunner} from '../../core/export/export-runner';
import {ImportState} from './import-state';
import {ProjectConfiguration} from '../../core/configuration/project-configuration';
import {AngularUtility} from '../../angular/angular-utility';
import BASE_EXCLUSION = ExportRunner.BASE_EXCLUSION;
import {TabManager} from '../../core/tabs/tab-manager';
import getCategoriesWithoutExcludedCategories = ExportRunner.getCategoriesWithoutExcludedCategories;
import {ViewFacade} from '../../core/resources/view/view-facade';
import {Messages} from '../messages/messages';
import {ProjectCategories} from '../../core/configuration/project-categories';
import {ExtensionUtil} from '../../core/util/extension-util';
import {MenuService} from '../menu-service';


@Component({
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

    public operations: Array<Document> = [];
    public javaInstalled: boolean = true;
    public running: boolean = false;

    public readonly allowedFileExtensions: string = '.csv, .jsonl, .geojson, .json, .shp';


    constructor(public importState: ImportState,
                private messages: Messages,
                private datastore: DocumentDatastore,
                private remoteChangesStream: ChangesStream,
                private importValidator: ImportValidator,
                private http: HttpClient,
                private usernameProvider: UsernameProvider,
                private projectConfiguration: ProjectConfiguration,
                private viewFacade: ViewFacade,
                private modalService: NgbModal,
                private synchronizationService: SyncService,
                private idGenerator: IdGenerator,
                private tabManager: TabManager,
                private menuService: MenuService) {

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
        this.updateCategories();
        this.javaInstalled = await JavaToolExecutor.isJavaInstalled();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === 'default') {
            await this.tabManager.openActiveTab();
        }
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
            && this.importState.format !== undefined
            && (this.importState.format !== 'shapefile' || !this.isJavaInstallationMissing())
            && (this.importState.sourceType === 'file'
                ? this.importState.file !== undefined
                : this.importState.url !== undefined);
    }


    public reset(): void {

        this.messages.removeAllMessages();
        this.importState.file = undefined;
        this.importState.format = undefined;
        this.importState.url = undefined;
    }


    public selectFile(event: any) {

        this.importState.typeFromFileName = false;

        const files = event.target.files;
        this.importState.file = !files || files.length === 0
            ? undefined
            : files[0];

        if (this.importState.file) {
            this.updateFormat();
            if (!this.importState.format) {
                this.messages.add([M.IMPORT_ERROR_INVALID_FILE_FORMAT, this.allowedFileExtensions]);
                return;
            }

            this.importState.selectedCategory = this.getCategoryFromFileName(this.importState.file.name);
            if (this.importState.selectedCategory) {
                this.importState.typeFromFileName = true;
            } else {
                this.selectFirstCategory();
            }
        }
    }


    public updateFormat() {

        this.importState.format = ImportComponent.getImportFormat(
            this.importState.file
                ? this.importState.file.name
                : this.importState.url
        );
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
            this.importState.file as any, this.importState.url as any, this.http);
        if (!reader) return this.messages.add([M.IMPORT_READER_GENERIC_START_ERROR]);

        this.menuService.setContext('modal');
        const uploadModalRef: any = this.modalService.open(
            UploadModalComponent,
            { backdrop: 'static', keyboard: false }
        );

        await AngularUtility.refresh();

        this.synchronizationService.stopSync();

        let importReport: ImportReport;
        try {
             importReport = await this.doImport(reader);
        } catch (errWithParams) {
            this.messages.add(MessagesConversion.convertMessage(errWithParams));
        }
        await this.synchronizationService.startSync();

        uploadModalRef.close();
        this.menuService.setContext('default');

        if (importReport) this.showImportResult(importReport);
    }


    public updateCategories() {

        this.importState.categories = getCategoriesWithoutExcludedCategories(
            this.projectConfiguration.getCategoriesArray(), this.getCategoriesToExclude()
        );

        if (!this.importState.selectedCategory || !this.importState.categories.includes(this.importState.selectedCategory)) {
            this.selectFirstCategory();
        }
    }


    private getCategoriesToExclude() {

        return this.importState.mergeMode
            ? BASE_EXCLUSION
            : BASE_EXCLUSION.concat(ProjectCategories.getImageCategoryNames(this.projectConfiguration.getCategoryTreelist()));
    }


    private async doImport(reader: Reader) {

        return Importer.doImport(
            this.importState.format,
            this.datastore,
            this.usernameProvider,
            this.projectConfiguration,
            this.importState.selectedOperationId,
            this.importState.mergeMode,
            this.importState.permitDeletions,
            await reader.go(),
            () => this.idGenerator.generateId(),
            this.importState.format === 'csv' ? this.importState.selectedCategory : undefined,
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
                categories: ProjectCategories.getOperationCategoryNames(this.projectConfiguration.getCategoryTreelist())
            })).documents;
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
            return [];
        }
    }


    private getCategoryFromFileName(fileName: string): Category|undefined {

        for (let segment of fileName.split('.')) {
            const category: Category|undefined = this.projectConfiguration.getCategoriesArray()
                .find(category => category.name.toLowerCase() === segment.toLowerCase());
            if (category) return category;
        }

        return undefined;
    }


    private selectFirstCategory() {

        if (this.importState.categories.length > 0) this.importState.selectedCategory = this.importState.categories[0];
    }


    private static createReader(sourceType: string, format: string, file: File, url: string,
                                http: HttpClient): Reader|undefined {

        return sourceType === 'file'
            ? format === 'shapefile'
                ? new ShapefileFileSystemReader(file)
                : new FileSystemReader(file)
            : new HttpReader(url, http);
    }


    private static getImportFormat(fileName: string): ImportFormat|undefined {

        switch(ExtensionUtil.getExtension(fileName)) {
            case 'jsonl':
                return 'native';
            case 'geojson':
            case 'json':
                return 'geojson';
            case 'shp':
                return 'shapefile';
            case 'csv':
                return 'csv';
            default:
                return undefined;
        }
    }
}

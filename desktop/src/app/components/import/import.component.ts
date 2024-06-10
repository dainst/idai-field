import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { copy, flow, forEach, isEmpty, map, remove, take, to } from 'tsfun';
import { CategoryForm, Datastore, Document, IdGenerator, Labels, Named, ProjectConfiguration, RelationsManager,
    SyncService, Tree, ImageStore } from 'idai-field-core';
import { AngularUtility } from '../../angular/angular-utility';
import { ExportRunner } from '../../components/export/export-runner';
import { Importer, ImporterFormat, ImporterOptions, ImporterReport } from '../../components/import/importer';
import { ImageRelationsManager } from '../../services/image-relations-manager';
import { JavaToolExecutor } from '../../services/java/java-tool-executor';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { TabManager } from '../../services/tabs/tab-manager';
import { ExtensionUtil } from '../../util/extension-util';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { ImportState } from './import-state';
import { MessagesConversion } from './messages-conversion';
import { UploadModalComponent } from './upload-modal.component';
import { AppState } from '../../services/app-state';
import { Settings } from '../../services/settings/settings';
import getCategoriesWithoutExcludedCategories = ExportRunner.getCategoriesWithoutExcludedCategories;


const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const ipcRenderer = typeof window !== 'undefined' ? window.require('electron').ipcRenderer : undefined;
const path = typeof window !== 'undefined' ? window.require('path') : require('path');


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
    public ignoredIdentifiers: string[] = [];

    public readonly allowedFileExtensions: string = '.csv, .jsonl, .geojson, .json, .shp, .catalog, .gpkg';
    public readonly allowedHttpFileExtensions: string = '.csv, .jsonl, .geojson, .json';


    constructor(public importState: ImportState,
                private messages: Messages,
                private datastore: Datastore,
                private relationsManager: RelationsManager,
                private imageRelationsManager: ImageRelationsManager,
                private imagestore: ImageStore,
                private http: HttpClient,
                private settingsProvider: SettingsProvider,
                private projectConfiguration: ProjectConfiguration,
                private modalService: NgbModal,
                private synchronizationService: SyncService,
                private idGenerator: IdGenerator,
                private tabManager: TabManager,
                private menuService: Menus,
                private appState: AppState,
                private labels: Labels,
                private i18n: I18n) {

        this.resetOperationIfNecessary();
    }


    public getDocumentLabel = (document: any) => Document.getLabel(document, this.labels, this.projectConfiguration);

    public getCategoryLabel = (category: CategoryForm) => this.labels.get(category);

    public isJavaInstallationMissing = () => this.importState.format === 'shapefile' && !this.javaInstalled;

    public isDefaultFormat = () => Importer.isDefault(this.importState.format);

    public isMergeMode = () => this.importState.mergeMode;

    public shouldDisplayPermitDeletionsOption = () => this.isDefaultFormat() && this.importState.mergeMode === true;

    public shouldDisplayImportIntoOperation = () =>
        Importer.importIntoOperationAvailable(this.importState, this.projectConfiguration);

    public getSeparator = () => this.importState.separator;

    public setSeparator = (separator: string) => this.importState.setSeparator(separator);

    public getAllowedFileExtensions = () => this.importState.sourceType === 'file'
        ? this.allowedFileExtensions
        : this.allowedHttpFileExtensions;


    async ngOnInit() {

        this.operations = await this.fetchOperations();
        this.updateCategories();
        this.javaInstalled = await JavaToolExecutor.isJavaInstalled();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public async onImportButtonClick() {

        AngularUtility.blurActiveElement();
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
            && this.ignoredIdentifiers.length < 2
            && this.importState.format !== undefined
            && (this.importState.format !== 'shapefile' || !this.isJavaInstallationMissing())
            && (this.importState.format !== 'csv' || this.importState.selectedCategory)
            && (this.importState.sourceType === 'file'
                ? this.importState.filePath !== undefined
                : this.importState.url !== undefined);
    }


    public reset(): void {

        this.messages.removeAllMessages();
        this.importState.filePath = undefined;
        this.importState.format = undefined;
        this.importState.url = undefined;
        this.importState.mergeMode = false;
        this.importState.permitDeletions = false;
        this.importState.ignoreUnconfiguredFields = false;
    }


    public async selectFile() {

        const filePath: string = await this.showOpenFileDialog();
        if (!filePath) return;

        this.reset();
        this.importState.typeFromFileName = false;
        this.importState.filePath = filePath;

        if (this.importState.filePath) {
            this.updateFormat();
            if (!this.importState.format) {
                this.messages.add([M.IMPORT_ERROR_INVALID_FILE_FORMAT, this.allowedFileExtensions]);
                return;
            }

            this.importState.selectedCategory = this.getCategoryFromFileName(path.basename(this.importState.filePath));
            if (this.importState.selectedCategory) this.importState.typeFromFileName = true;
        }
    }


    public setMergeMode(mergeImport: boolean) {

        this.importState.mergeMode = mergeImport;
        this.importState.permitDeletions = false;
        this.updateCategories();
    }


    public updateFormat() {

        this.importState.format = ImportComponent.getImportFormat(
            this.importState.filePath
                ? path.basename(this.importState.filePath)
                : this.importState.url
        );
    }


    public updateCategories() {

        this.importState.categories = getCategoriesWithoutExcludedCategories(
            Tree.flatten(this.projectConfiguration.getCategories()), this.getCategoriesToExclude()
        );

        if (!this.importState.categories.includes(this.importState.selectedCategory)) {
            this.importState.selectedCategory = undefined;
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

        this.menuService.setContext(MenuContext.MODAL);
        const uploadModalRef: any = this.modalService.open(
            UploadModalComponent,
            { backdrop: 'static', keyboard: false, animation: false }
        );

        await AngularUtility.refresh();

        this.synchronizationService.stopSync();

        let importReport: ImporterReport;
        try {
             importReport = await this.doImport();
        } catch (errWithParams) {
            this.messages.add(MessagesConversion.convertMessage(errWithParams));
        }
        if (Settings.isSynchronizationActive(this.settingsProvider.getSettings())) {
            await this.synchronizationService.startSync();
        }

        uploadModalRef.close();
        this.menuService.setContext(MenuContext.DEFAULT);

        if (importReport) this.showImportResult(importReport);
    }


    private getCategoriesToExclude() {

        return this.importState.mergeMode
            ? ExportRunner.EXCLUDED_CATEGORIES
            : ExportRunner.EXCLUDED_CATEGORIES
                .concat(this.projectConfiguration.getImageCategories().map(Named.toName));
    }


    private async doImport() {

        if (this.importState.format === 'geopackage') {
            this.testReadingGeopackage();
            return;
        }

        const options = copy(this.importState as any) as unknown as ImporterOptions;
        if (options.mergeMode === true) options.selectedOperationId = '';

        const fileContents = await Importer.doRead(
            this.http,
            this.settingsProvider.getSettings(),
            this.imagestore,
            options
        );

        const documents = await Importer.doParse(
            options,
            fileContents
        );

        return Importer.doImport(
            {
                datastore: this.datastore,
                relationsManager: this.relationsManager,
                imageRelationsManager: this.imageRelationsManager,
                imagestore: this.imagestore
            },
            {
                settings: this.settingsProvider.getSettings(),
                projectConfiguration: this.projectConfiguration,
                operationCategories: this.projectConfiguration.getOperationCategories().map(Named.toName) // TODO review
            },
            () => this.idGenerator.generateId(),
            options,
            documents,
            this.projectConfiguration.getTypeCategories().map(to(Named.NAME))
        );
    }


    private showImportResult(importReport: ImporterReport) {

        if (importReport.errors.length > 0) {
            return this.showMessages(importReport.errors);
        }  else if (importReport.successfulImports === 0 && importReport.ignoredIdentifiers.length === 0) {
            this.showEmptyImportWarning();
        } else {
            this.showSuccessMessage(importReport.successfulImports);
        }

        this.ignoredIdentifiers = importReport.ignoredIdentifiers;
        if (this.ignoredIdentifiers.length > 0) this.showIgnoredIdentifiersWarning(this.ignoredIdentifiers);
    }


    private showEmptyImportWarning() {

        this.messages.add([M.IMPORT_WARNING_EMPTY]);
    }


    private showIgnoredIdentifiersWarning(ignoredIdentifiers: string[]) {

        this.messages.add([
            (this.importState.mergeMode || ['geojson', 'shapefile'].includes(this.importState.format))
                ? ignoredIdentifiers.length === 1
                    ? M.IMPORT_WARNING_IGNORED_MISSING_IDENTIFIER
                    : M.IMPORT_WARNING_IGNORED_MISSING_IDENTIFIERS
                : ignoredIdentifiers.length === 1
                    ? M.IMPORT_WARNING_IGNORED_EXISTING_IDENTIFIER
                    : M.IMPORT_WARNING_IGNORED_EXISTING_IDENTIFIERS,
            ignoredIdentifiers.length === 1
                ? ignoredIdentifiers[0]
                : ignoredIdentifiers.length.toString()
        ]);
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
            remove(isEmpty),
            take(1),
            forEach((msgWithParams: any) => this.messages.add(msgWithParams))
        );
    }


    private async fetchOperations(): Promise<Array<Document>> {

        try {
            return (await this.datastore.find({
                categories: this.projectConfiguration.getOperationCategories().map(Named.toName)
            })).documents;
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
            return [];
        }
    }


    private getCategoryFromFileName(fileName: string): CategoryForm|undefined {

        for (let segment of fileName.split('.')) {
            const category: CategoryForm|undefined = Tree.flatten(this.projectConfiguration.getCategories())
                .find(category => category.name.toLowerCase() === segment.toLowerCase().replace('+', ':'));
            if (category) return category;
        }

        return undefined;
    }


    private async showOpenFileDialog(): Promise<string> {

        const result = await remote.dialog.showOpenDialog(
            remote.getCurrentWindow(),
            {
                properties: ['openFile'],
                defaultPath: this.appState.getFolderPath('import'),
                buttonLabel: this.i18n({ id: 'openFileDialog.select', value: 'Auswählen' }),
                filters: this.getFileFilters()
            }
        );

        if (result.filePaths.length) {
            await this.appState.setFolderPath(result.filePaths[0], 'import');
            return result.filePaths[0];
        } else {
            return undefined;
        }
    }


    private getFileFilters(): any[] {

        return [
            {
                name: this.i18n({ id: 'import.selectFile.filters.all', value: 'Alle unterstützten Formate' }),
                extensions: ['csv', 'jsonl', 'geojson', 'json', 'shp', 'catalog', 'gpkg']
            },
            {
                name: 'CSV',
                extensions: ['csv']
            },
            {
                name: 'JSON Lines',
                extensions: ['jsonl']
            },
            {
                name: 'GeoJSON',
                extensions: ['geojson', 'json']
            },
            {
                name: 'Shapefile',
                extensions: ['shp']
            },
            {
                name: this.i18n({ id: 'import.selectFile.filters.catalog', value: 'Field-Typenkatalog' }),
                extensions: ['catalog']
            },
            {
                name: 'Geopackage',
                extensions: ['gpkg']
            },
        ];
    }


    private async testReadingGeopackage() {

        const returnValue = await ipcRenderer.invoke('readGeopackage', this.importState.filePath);

        if (returnValue.error) {
            console.error(returnValue.error);
        } else {
            console.log('Result:', returnValue.result);
        }
    }


    private static getImportFormat(fileName: string): ImporterFormat|undefined {

        switch(ExtensionUtil.getExtension(fileName)) {
            case 'catalog':
                return 'catalog';
            case 'jsonl':
                return 'native';
            case 'geojson':
            case 'json':
                return 'geojson';
            case 'shp':
                return 'shapefile';
            case 'csv':
                return 'csv';
            case 'gpkg':
                return 'geopackage';
            default:
                return undefined;
        }
    }
}

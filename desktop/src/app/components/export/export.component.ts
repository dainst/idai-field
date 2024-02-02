import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { CategoryForm, Datastore, FieldDocument, Query, Labels, Document, Tree, Named,
    ProjectConfiguration } from 'idai-field-core';
import { CatalogExporter, ERROR_FAILED_TO_COPY_IMAGES } from '../../components/export/catalog/catalog-exporter';
import { ERROR_NOT_ALL_IMAGES_EXCLUSIVELY_LINKED } from '../../components/export/catalog/get-export-documents';
import { CsvExporter } from '../../components/export/csv/csv-exporter';
import { CategoryCount } from '../../components/export/export-helper';
import { ExportRunner } from '../../components/export/export-runner';
import { GeoJsonExporter } from '../../components/export/geojson-exporter';
import { ShapefileExporter } from './shapefile-exporter';
import { JavaToolExecutor } from '../../services/java/java-tool-executor';
import { TabManager } from '../../services/tabs/tab-manager';
import { M } from '../messages/m';
import { Messages } from '../messages/messages';
import { ExportModalComponent } from './export-modal.component';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { ImageRelationsManager } from '../../services/image-relations-manager';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';
import { InvalidField } from './csv/csv-export';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


@Component({
    templateUrl: './export.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class ExportComponent implements OnInit {

    public format: 'geojson'|'shapefile'|'csv'|'catalog' = 'csv';
    public initializing: boolean = false;
    public running: boolean = false;
    public javaInstalled: boolean = true;
    public operations: Array<FieldDocument> = [];
    public catalogs: Array<FieldDocument> = [];

    public categoryCounts: Array<CategoryCount> = [];
    public selectedCategory: CategoryForm|undefined = undefined;
    public selectedContext: string = 'project';
    public selectedCatalogId: string;
    public csvExportMode: 'schema'|'complete' = 'complete';
    public combineHierarchicalRelations: boolean = true;
    
    public invalidFields: Array<InvalidField> = [];

    private modalRef: NgbModalRef|undefined;

    private static TIMEOUT: number = 200;


    constructor(private settingsProvider: SettingsProvider,
                private modalService: NgbModal,
                private messages: Messages,
                private i18n: I18n,
                private datastore: Datastore,
                private tabManager: TabManager,
                private projectConfiguration: ProjectConfiguration,
                private menuService: Menus,
                private imageRelationsManager: ImageRelationsManager,
                private labels: Labels) {}


    public getDocumentLabel = (operation: FieldDocument) => Document.getLabel(
        operation, this.labels, this.projectConfiguration
    );

    public getCategoryLabel = (category: CategoryForm) => this.labels.get(category);

    public isJavaInstallationMissing = () => this.format === 'shapefile' && !this.javaInstalled;

    public noResourcesFound = () => this.categoryCounts.length === 0 && !this.initializing;

    public noCatalogsFound = () => this.catalogs.length === 0 && !this.initializing;

    public find = (query: Query) => this.datastore.find(query);

    public showOperations = () => this.format === 'csv' ? this.csvExportMode === 'complete' : this.format !== 'catalog';

    public showCatalogs = () => this.format === 'catalog';


    async ngOnInit() {

        this.initializing = true;

        this.operations = await this.fetchOperationsAndPlaces();
        this.catalogs = await this.fetchCatalogs();
        if (this.catalogs.length > 0) this.selectedCatalogId = this.catalogs[0].resource.id;
        await this.setCategoryCounts();
        this.javaInstalled = await JavaToolExecutor.isJavaInstalled();

        this.initializing = false;
    }


    public async setCategoryCounts() {

        this.categoryCounts = await ExportRunner.determineCategoryCounts(
            this.find,
            this.getExportContext(),
            Tree.flatten(this.projectConfiguration.getCategories())
        );

        if (this.categoryCounts.length > 0) this.selectedCategory = this.categoryCounts[0][0];
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public isExportButtonEnabled() {

        return !this.isJavaInstallationMissing()
            && !this.initializing
            && !this.running
            && this.categoryCounts.length > 0
            && (this.format !== 'catalog' || this.catalogs.length > 0);
    }


    private getExportContext(): ExportRunner.ExportContext {

        return this.csvExportMode === 'complete' ? this.selectedContext : undefined;
    }


    public async startExport() {

        this.messages.removeAllMessages();

        const filePath: string = await this.chooseFilepath();
        if (!filePath) return;

        this.running = true;
        this.menuService.setContext(MenuContext.MODAL);
        this.openModal();

        try {
            if (this.format === 'geojson') await this.startGeojsonExport(filePath);
            else if (this.format === 'shapefile') await this.startShapeFileExport(filePath);
            else if (this.format === 'csv') await this.startCsvExport(filePath);
            else if (this.format === 'catalog') await this.startCatalogExport(filePath);

            this.messages.add([M.EXPORT_SUCCESS]);
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }

        this.running = false;
        this.menuService.setContext(MenuContext.DEFAULT);
        this.closeModal();
    }


    private async startCatalogExport(filePath: string) {

        try {
            await CatalogExporter.performExport(
                this.datastore,
                this.imageRelationsManager,
                filePath,
                this.selectedCatalogId,
                this.settingsProvider.getSettings()
            );
        } catch (err) {
            if (err.length > 0 && err[0] === ERROR_NOT_ALL_IMAGES_EXCLUSIVELY_LINKED) {
                err[0] = [M.EXPORT_CATALOG_IMAGES_NOT_EXCLUSIVE_TO_CATALOG];
                throw err;
            } else if (err.length > 0 && err[0] === ERROR_FAILED_TO_COPY_IMAGES) {
                err[0] = [M.EXPORT_CATALOG_FAILED_TO_COPY_IMAGES];
                throw err;
            }
            console.error(err);
            throw [M.EXPORT_ERROR_GENERIC];
        }
    }


    private async startGeojsonExport(filePath: string) {

        await GeoJsonExporter.performExport(
            this.datastore,
            filePath,
            this.selectedContext
        );
    }


    private async startShapeFileExport(filePath: string) {

        await ShapefileExporter.performExport(
            this.settingsProvider.getSettings(),
            await this.datastore.get('project'),
            filePath,
            this.selectedContext
        );
    }


    private async startCsvExport(filePath: string) {

        if (!this.selectedCategory) return console.error('No category selected');

        try {
            this.invalidFields = await ExportRunner.performExport(
                this.find,
                (async resourceId => (await this.datastore.get(resourceId)).resource.identifier),
                this.getExportContext(),
                this.selectedCategory,
                this.projectConfiguration
                    .getRelationsForDomainCategory(this.selectedCategory.name)
                    .map(_ => _.name),
                CsvExporter.performExport(
                    filePath,
                    this.projectConfiguration.getProjectLanguages(),
                    this.combineHierarchicalRelations
                )
            );

            this.showInvalidFieldsWarning();
        } catch(err) {
            console.error(err);
            throw [M.EXPORT_ERROR_GENERIC];
        }
    }


    private chooseFilepath(): Promise<string> {

        return new Promise<string>(async resolve => {

            const options: any = { filters: [this.getFileFilter()] };
            if (this.selectedCategory) {
                if (this.format === 'catalog') {
                    options.defaultPath = this.getSelectedCatalog().resource.identifier;
                } else {
                    options.defaultPath = this.i18n({ id: 'export.dialog.untitled', value: 'Ohne Titel' });
                }

                if (this.format === 'csv') options.defaultPath += '.' + this.selectedCategory.name.toLowerCase().replace(':', '+');
                if (remote.process.platform === 'linux') { // under linux giving the extensions entries in fileFilter will not automatically add the extensions
                    let ext = 'csv';
                    if (this.format === 'shapefile') ext = 'zip';
                    if (this.format === 'geojson') ext = 'geojson';
                    if (this.format === 'catalog') ext = 'catalog';
                    options.defaultPath += '.' + ext;
                }
            }

            const saveDialogReturnValue = await remote.dialog.showSaveDialog(options);
            resolve(saveDialogReturnValue.filePath);
        });
    }


    private getFileFilter(): any {

        switch (this.format) {
            case 'catalog':
                return {
                    name: this.i18n({ id: 'export.dialog.filter.catalog', value: 'Katalog' }),
                    extensions: ['catalog']
                };
            case 'geojson':
                return {
                    name: this.i18n({ id: 'export.dialog.filter.geojson', value: 'GeoJSON-Datei' }),
                    extensions: ['geojson', 'json']
                };
            case 'shapefile':
                return {
                    name: this.i18n({ id: 'export.dialog.filter.zip', value: 'ZIP-Archiv' }),
                    extensions: ['zip']
                };
            case 'csv':
                return {
                    name: 'CSV',
                    extensions: ['csv']
                };
        }
    }


    private openModal() {

        setTimeout(() => {
            if (this.running) {
                this.modalRef = this.modalService.open(
                    ExportModalComponent,
                    { backdrop: 'static', keyboard: false, animation: false }
                );
            }
        }, ExportComponent.TIMEOUT);
    }


    private closeModal() {

        if (this.modalRef) this.modalRef.close();
        this.modalRef = undefined;
    }


    private async fetchCatalogs(): Promise<Array<FieldDocument>> {

        try {
            return (await this.datastore.find({
                categories: ['TypeCatalog'],
                constraints: { 'project:exist': 'UNKNOWN' }
            })).documents as Array<FieldDocument>;
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
            return [];
        }
    }


    private async fetchOperationsAndPlaces(): Promise<Array<FieldDocument>> {


        const categories = this.projectConfiguration.getOverviewCategories()
            .map(Named.toName)
            .filter(name => name !== 'Operation');

        try {
            return (await this.datastore.find({
                categories: categories
            })).documents as Array<FieldDocument>;
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
            return [];
        }
    }


    private getSelectedCatalog(): FieldDocument {

        return this.catalogs.find(catalog => catalog.resource.id === this.selectedCatalogId);
    }


    private showInvalidFieldsWarning() {

        if (this.invalidFields.length === 1) {
            this.messages.add([
                M.EXPORT_CSV_WARNING_INVALID_FIELD_DATA_SINGLE,
                this.invalidFields[0].fieldName,
                this.invalidFields[0].identifier
            ]);
        } else if (this.invalidFields.length > 1) {
            this.messages.add([M.EXPORT_CSV_WARNING_INVALID_FIELD_DATA_MULTIPLE]);
        }
    }
}

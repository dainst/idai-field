import {Component, OnInit} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {FieldDocument, IdaiType, Messages, ProjectConfiguration, Query} from 'idai-components-2';
import {SettingsService} from '../../core/settings/settings-service';
import {M} from '../m';
import {ExportModalComponent} from './export-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {JavaToolExecutor} from '../../common/java-tool-executor';
import {FieldReadDatastore} from '../../core/datastore/field/field-read-datastore';
import {GeoJsonExporter} from '../../core/export/geojson-exporter';
import {ShapefileExporter} from '../../core/export/shapefile-exporter';
import {TypeUtility} from '../../core/model/type-utility';
import {TabManager} from '../tab-manager';
import {CsvExportHelper} from './csv-export-helper';
import {ResourceTypeCount} from './export-helper';
import {to} from 'tsfun';

const remote = require('electron').remote;



@Component({
    moduleId: module.id,
    templateUrl: './export.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class ExportComponent implements OnInit {

    public format: 'geojson' | 'shapefile' | 'csv' = 'geojson';
    public running: boolean = false;
    public javaInstalled: boolean = true;
    public operations: Array<FieldDocument> = [];

    public resourceTypeCounts: Array<ResourceTypeCount> = [];
    public selectedType: IdaiType|undefined = undefined;


    public selectedOperationId: string = 'project';
    public csvExportMode: 'schema' | 'complete' = 'complete';

    private modalRef: NgbModalRef|undefined;

    private static TIMEOUT: number = 200;


    constructor(private settingsService: SettingsService,
                private modalService: NgbModal,
                private messages: Messages,
                private i18n: I18n,
                private viewFacade: ViewFacade,
                private datastore: FieldReadDatastore,
                private typeUtility: TypeUtility,
                private tabManager: TabManager,
                private projectConfiguration: ProjectConfiguration) {}


    public getOperationLabel = (operation: FieldDocument) => ModelUtil.getDocumentLabel(operation);

    public isJavaInstallationMissing = () => this.format === 'shapefile' && !this.javaInstalled;

    public find = (query: Query) => this.datastore.find(query);

    public showOperations = () => this.format !== 'csv' || this.csvExportMode === 'complete';


    async ngOnInit() {

        this.operations = await this.fetchOperations();
        await this.setTypeCounts();
        this.javaInstalled = await JavaToolExecutor.isJavaInstalled();
    }


    public async setTypeCounts() {

        this.resourceTypeCounts = await CsvExportHelper.determineTypeCounts(
            this.find,
            this.getOperationIdForMode(),
            this.projectConfiguration.getTypesList());

        if (this.resourceTypeCounts.length > 0) this.selectedType = this.resourceTypeCounts[0][0];
    }



    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') await this.tabManager.openActiveTab();
    }


    private getOperationIdForMode() {

        return this.csvExportMode === 'complete' ? this.selectedOperationId : undefined;
    }


    public async startExport() {

        const filePath: string = await this.chooseFilepath();
        if (!filePath) return;

        this.running = true;
        this.openModal();

        try {
            if (this.format === 'geojson') await this.startGeojsonExport(filePath);
            else if (this.format === 'shapefile') await this.startShapeFileExport(filePath);
            else if (this.format === 'csv') await this.startCsvExport(filePath);

            this.messages.add([M.EXPORT_SUCCESS]);
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }

        this.running = false;
        this.closeModal();
    }


    private async startGeojsonExport(filePath: string) {

        await GeoJsonExporter.performExport(this.datastore, filePath, this.selectedOperationId);
    }


    private async startShapeFileExport(filePath: string) {

        await ShapefileExporter.performExport(this.settingsService.getSelectedProject(),
            this.settingsService.getProjectDocument(), filePath, this.selectedOperationId);
    }


    private async startCsvExport(filePath: string) {

        if (this.selectedType) {

            await CsvExportHelper.performExport(
                this.find,
                filePath,
                this.getOperationIdForMode(),
                this.selectedType,
                (this.projectConfiguration as any).getRelationDefinitions(this.selectedType.name).map(to('name')),
                (async resourceId => (await this.datastore.get(resourceId)).resource.identifier));

        } else console.error("No resource type selected");
    }


    private chooseFilepath(): Promise<string> {

        return new Promise<string>(async resolve => {

            const filePath = await remote.dialog.showSaveDialog({
                filters: [this.getFileFilter()]
            });
            resolve(filePath);
        });
    }


    private getFileFilter(): any {

        switch (this.format) {
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
                    { backdrop: 'static', keyboard: false }
                );
            }
        }, ExportComponent.TIMEOUT);
    }


    private closeModal() {

        if (this.modalRef) this.modalRef.close();
        this.modalRef = undefined;
    }


    private async fetchOperations(): Promise<Array<FieldDocument>> {

        try {
            return (await this.datastore.find({
                types: this.typeUtility.getOperationTypeNames()
            })).documents;
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
            return [];
        }
    }
}
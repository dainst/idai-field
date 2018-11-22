import {Component, OnInit} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Messages, IdaiFieldDocument} from 'idai-components-2';
import {SettingsService} from '../../core/settings/settings-service';
import {M} from '../m';
import {ExportModalComponent} from './export-modal.component';
import {ShapefileExporter} from './shapefile-exporter';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {JavaToolExecutor} from '../../common/java-tool-executor';

const remote = require('electron').remote;


@Component({
    moduleId: module.id,
    templateUrl: './export.html'
})
/**
 * @author Thomas Kleinke
 */
export class ExportComponent implements OnInit {

    public format: 'shapefile' = 'shapefile';
    public running: boolean = false;
    public javaInstalled: boolean = true;
    public operations: Array<IdaiFieldDocument> = [];
    public selectedOperationId: string = 'project';

    private modalRef: NgbModalRef|undefined;

    private static TIMEOUT: number = 200;


    constructor(private settingsService: SettingsService,
                private modalService: NgbModal,
                private messages: Messages,
                private i18n: I18n,
                private viewFacade: ViewFacade) {}


    public getOperationLabel = (operation: IdaiFieldDocument) => ModelUtil.getDocumentLabel(operation);

    public isJavaInstallationMissing = () => this.format === 'shapefile' && !this.javaInstalled;


    async ngOnInit() {

        await this.fetchOperations();
        this.javaInstalled = await JavaToolExecutor.isJavaInstalled();
    }


    public async startExport() {

        const filePath: string = await this.chooseFilepath();
        if (!filePath) return;

        this.running = true;
        this.openModal();

        try {
            await ShapefileExporter.performExport(this.settingsService.getProjectDocument(), filePath,
                this.selectedOperationId);
            this.messages.add([M.EXPORT_SUCCESS]);
        } catch (err) {
            this.messages.add(ExportComponent.getErrorMsgWithParams(err));
        }

        this.running = false;
        this.closeModal();
    }


    private chooseFilepath(): Promise<string> {

        return new Promise<string>(async resolve => {

            const filePath = await remote.dialog.showSaveDialog({
                filters: [{
                        name: this.i18n({ id: 'export.dialog.filter.zip', value: 'ZIP-Archiv' }),
                        extensions: ['zip']
                    }]
            });
            resolve(filePath);
        });
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


    private async fetchOperations() {

        try {
            this.operations = await this.viewFacade.getAllOperations();
        } catch (msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }


    private static getErrorMsgWithParams(error: string): string[] {

        if (error.includes('EXPORTER_TEMP_FOLDER_CREATION_ERROR')) {
            return [
                M.EXPORT_SHAPEFILE_ERROR_TEMP_FOLDER_CREATION,
                JavaToolExecutor.getParameterFromErrorMessage(error)
            ];
        } else if (error.includes('EXPORTER_ZIP_FILE_WRITE_ERROR')) {
            return [
                M.EXPORT_SHAPEFILE_ERROR_ZIP_FILE_CREATION,
                JavaToolExecutor.getParameterFromErrorMessage(error)
            ];
        } else if (error.includes('EXPORTER_SHAPEFILE_WRITE_ERROR')) {
            return [M.EXPORT_SHAPEFILE_ERROR_WRITE];
        } else if (error.includes('DATASTORE_GET_RESOURCES_ERROR')) {
            return [M.EXPORT_SHAPEFILE_ERROR_GET_RESOURCES];
        } else {
            console.error(error);
            return [M.EXPORT_ERROR_GENERIC];
        }
    }
}
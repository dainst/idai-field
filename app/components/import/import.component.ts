import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {empty, filter, flow, forEach, is, isNot, map, on, take} from 'tsfun';
import {Document, IdaiType, Messages, ProjectConfiguration} from 'idai-components-2';
import {Importer, ImportFormat, ImportReport} from '../../core/import/importer';
import {Reader} from '../../core/import/reader/reader';
import {FileSystemReader} from '../../core/import/reader/file-system-reader';
import {HttpReader} from '../../core/import/reader/http-reader';
import {UploadModalComponent} from './upload-modal.component';
import {ViewFacade} from '../resources/view/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {RemoteChangesStream} from '../../core/datastore/core/remote-changes-stream';
import {UsernameProvider} from '../../core/settings/username-provider';
import {SettingsService} from '../../core/settings/settings-service';
import {MessagesConversion} from './messages-conversion';
import {M} from '../m';
import {ShapefileFileSystemReader} from '../../core/import/reader/shapefile-filesystem-reader';
import {JavaToolExecutor} from '../../common/java-tool-executor';
import {ImportValidator} from '../../core/import/exec/import-validator';
import {IdGenerator} from '../../core/datastore/core/id-generator';
import {TypeUtility} from '../../core/model/type-utility';
import {DocumentDatastore} from '../../core/datastore/document-datastore';
import {TabManager} from '../tab-manager';
import {ExportRunner} from '../../core/export/export-runner';
import {includedIn} from 'tsfun/src/comparator';
import {DatingUtil} from '../../core/util/dating-util';
import {DimensionUtil} from '../../core/util/dimension-util';
import BASE_EXCLUSION = ExportRunner.BASE_EXCLUSION;
import getTypesWithoutExcludedTypes = ExportRunner.getTypesWithoutExcludedTypes;


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

    public sourceType: string = 'file';
    public format: ImportFormat = 'native';
    public file: File|undefined;
    public url: string|undefined;
    public operations: Array<Document> = [];
    public selectedOperationId: string = '';
    public selectedType: IdaiType|undefined = undefined; // for csv import, the technical type name
    public resourceTypes: Array<IdaiType> = []; // for csv import
    public allowMergingExistingResources = false;
    public allowUpdatingRelationOnMerge = false;
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
        private idGenerator: IdGenerator,
        private typeUtility: TypeUtility,
        private tabManager: TabManager) {}


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);

    public isJavaInstallationMissing = () => this.format === 'shapefile' && !this.javaInstalled;

    public showMergeOption = () => this.format === 'native' || this.format === 'csv';

    public showMergeRelationsOption = () => includedIn(['native', 'csv'])(this.format) && this.allowMergingExistingResources;

    public isMeninxProject = () => this.settingsService.getSelectedProject().indexOf('meninx-project') !== -1;

    public isTestProject = () => this.settingsService.getSelectedProject().indexOf('test') !== -1;

    public showImportIntoOperation = () => (this.format === 'native' || this.format === 'csv') && !this.allowMergingExistingResources;


    async ngOnInit() {

        this.operations = await this.fetchOperations();

        this.resourceTypes =
            getTypesWithoutExcludedTypes(
                this.projectConfiguration.getTypesList(),
                BASE_EXCLUSION);

        if (this.resourceTypes.length > 0) this.selectedType = this.resourceTypes[0];
        this.javaInstalled = await JavaToolExecutor.isJavaInstalled();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') await this.tabManager.openActiveTab();
    }


    public onFormatChange() {

        if (this.format === 'shapefile' && this.sourceType === 'http') this.sourceType = 'file';
    }


    public async startImport() {

        const reader: Reader|undefined = ImportComponent.createReader(this.sourceType, this.format,
            this.file as any, this.url as any, this.http);
        if (!reader) return this.messages.add([M.IMPORT_READER_GENERIC_START_ERROR]);

        let uploadModalRef: any = undefined;
        let uploadReady = false;
        setTimeout(() => {
            if (!uploadReady) uploadModalRef = this.modalService.open(UploadModalComponent,
                { backdrop: 'static', keyboard: false });
        }, 200);

        this.remoteChangesStream.setAutoCacheUpdate(false);

        const importReport = await this.doImport(reader);

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
            case 'csv':
                return '.csv';
        }
    }


    private async doImport(reader: Reader) {

        return Importer.doImport(
            this.format,
            this.typeUtility,
            this.datastore,
            this.usernameProvider,
            this.projectConfiguration,
            this.selectedOperationId,
            this.allowMergingExistingResources,
            this.allowUpdatingRelationOnMerge,
            await reader.go(),
            () => this.idGenerator.generateId(),
            (document: Document) => this.postProcessDocument(document),
            this.format === 'csv' ? this.selectedType : undefined);
    }


    private postProcessDocument(document: Document) { // TODO test, move into import and remove parameter postProcessDocument from doImport

        const resource = document.resource;
        for (let field of Object.keys(resource).filter(isNot(includedIn(['relations', 'geometry', 'type'])))) {
            const fieldDefinition = this.projectConfiguration.getFieldDefinitions(resource.type).find(on('name', is(field)));
            if (!fieldDefinition) {
                console.error("no field definition found for", field);
                continue;
            }

            if (fieldDefinition.inputType === 'dating') {

                for (let dating of resource[field]) DatingUtil.setNormalizedYears(dating);
            }
            if (fieldDefinition.inputType === 'dimension') {

                for (let dimension of resource[field]) DimensionUtil.addNormalizedValues(dimension);
            }
        }
        return document;
    };


    private showImportResult(importReport: ImportReport) {

        if (importReport.errors.length > 0) return this.showMessages(importReport.errors);

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


    private static createReader(sourceType: string, format: string, file: File, url: string,
                                http: HttpClient): Reader|undefined {

        return sourceType === 'file'
            ? format === 'shapefile'
                ? new ShapefileFileSystemReader(file)
                : new FileSystemReader(file)
            : new HttpReader(url, http);
    }
}
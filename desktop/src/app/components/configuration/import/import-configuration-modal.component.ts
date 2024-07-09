import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { compareVersions } from 'compare-versions';
import { isArray } from 'tsfun';
import { ConfigReader, ConfigurationDocument, Document } from 'idai-field-core';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import { M } from '../../messages/m';
import { Messages } from '../../messages/messages';
import { getAsynchronousFs } from '../../../services/get-asynchronous-fs';
import { AppState } from '../../../services/app-state';

const PouchDB = window.require('pouchdb-browser');
const remote = window.require('@electron/remote');


@Component({
    selector: 'import-configuration-modal',
    templateUrl: './import-configuration-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
    }
})

/**
 * @author Thomas Kleinke
 */
export class ImportConfigurationModalComponent {

    public configurationDocument: ConfigurationDocument;
    public applyChanges: (configurationDocument: ConfigurationDocument,
        reindexConfiguration?: boolean) => Promise<void>;

    public source: 'file'|'project' = 'file';
    public selectedProject: string;
    public filePath: string;


    constructor(public activeModal: NgbActiveModal,
                private configReader: ConfigReader,
                private settingsProvider: SettingsProvider,
                private messages: Messages,
                private appState: AppState) {}


    public selectProject = (project: string) => this.selectedProject = project;

    public getProjects = () => this.settingsProvider.getSettings().dbs.slice(1).filter(db => db !== 'test');


    public isConfirmButtonEnabled(): boolean {
        
        return (this.source === 'file' && this.filePath !== undefined)
            || (this.source === 'project' && this.selectedProject !== undefined);
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public async selectFile() {

        const result: any = await remote.dialog.showOpenDialog(
            remote.getCurrentWindow(),
            {
                properties: ['openFile'],
                defaultPath: this.appState.getFolderPath('configurationImport'),
                buttonLabel: $localize `:@@openFileDialog.select:Auswählen`,
                filters: [
                    {
                        name: $localize `:@@configuration.importModal.filters.configuration:Field-Konfiguration`,
                        extensions: ['configuration']
                    }
                ]
            }
        );

        if (result.filePaths.length) {
            this.filePath = result.filePaths[0];
            this.appState.setFolderPath(this.filePath, 'configurationImport');
        }
    }


    public reset() {

        this.filePath = undefined;
        this.selectedProject = undefined;
    }


    public async confirm() {

        if (!this.isConfirmButtonEnabled()) return;

        try {
            if (this.source === 'file') {
                await this.performImportFromFile();
            } else {
                await this.performImportFromProject();
            }
            this.messages.add([M.CONFIGURATION_SUCCESS_IMPORT]);
            this.activeModal.close();
        } catch (err) {
            if (isArray(err)) {
                this.messages.add(err as string[]);
            } else {
                this.messages.add([M.CONFIGURATION_ERROR_IMPORT_FAILURE]);
            }
        }
    }


    private async performImportFromProject() {

        const configurationDocumentToImport: ConfigurationDocument
            = await this.fetchConfigurationDocument(this.selectedProject);
        
        const clonedConfigurationDocument = Document.clone(this.configurationDocument);
        clonedConfigurationDocument.resource = configurationDocumentToImport.resource;
        
        return await this.applyChanges(clonedConfigurationDocument, true);
    }


    private async performImportFromFile() {

        const fileContent: string = await getAsynchronousFs().readFile(this.filePath, 'utf-8');
        const deserializedObject = JSON.parse(Buffer.from(fileContent, 'base64').toString());
        if (!this.isCompatibleVersion(deserializedObject.version)) {
            throw [M.CONFIGURATION_ERROR_IMPORT_UNSUPPORTED_VERSION, deserializedObject.version];
        }

        const clonedConfigurationDocument = Document.clone(this.configurationDocument);
        clonedConfigurationDocument.resource.forms = deserializedObject.forms;
        clonedConfigurationDocument.resource.languages = deserializedObject.languages;
        clonedConfigurationDocument.resource.order = deserializedObject.order;
        clonedConfigurationDocument.resource.valuelists = deserializedObject.valuelists;
        clonedConfigurationDocument.resource.projectLanguages = deserializedObject.projectLanguages;

        return await this.applyChanges(clonedConfigurationDocument, true);
    }


    private fetchConfigurationDocument(project: string): Promise<ConfigurationDocument> {

        const db = new PouchDB(project);

        return ConfigurationDocument.getConfigurationDocument(
            id => db.get(id),
            this.configReader,
            project,
            this.settingsProvider.getSettings().username
        );
    }


    private isCompatibleVersion(version: string): boolean {

        return compareVersions(remote.app.getVersion(), version) !== -1;
    }
}

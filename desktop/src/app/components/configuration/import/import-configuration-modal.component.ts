import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { compareVersions } from 'compare-versions';
import { isString } from 'tsfun';
import { ConfigReader, ConfigurationDocument, Document } from 'idai-field-core';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import { M } from '../../messages/m';
import { Messages } from '../../messages/messages';
import { getAsynchronousFs } from '../../../services/getAsynchronousFs';

const PouchDB = typeof window !== 'undefined' ? window.require('pouchdb-browser') : require('pouchdb-node');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


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
    public selectedFile: any;


    constructor(public activeModal: NgbActiveModal,
                private configReader: ConfigReader,
                private settingsProvider: SettingsProvider,
                private messages: Messages) {}


    public selectProject = (project: string) => this.selectedProject = project;

    public getProjects = () => this.settingsProvider.getSettings().dbs.slice(1).filter(db => db !== 'test');


    public isConfirmButtonEnabled(): boolean {
        
        return (this.source === 'file' && this.selectedFile)
            || (this.source === 'project' && this.selectedProject);
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public selectFile(event: any) {

        this.selectedFile = event.target.files?.length ? event.target.files[0] : undefined;
    }


    public reset() {

        this.selectedFile = undefined;
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
            if (isString(err)) {
                this.messages.add([M.CONFIGURATION_ERROR_IMPORT_FAILURE]);
            } else {
                this.messages.add(err);
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

        const fileContent: string = await getAsynchronousFs().readFile(this.selectedFile.path, 'utf-8');
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

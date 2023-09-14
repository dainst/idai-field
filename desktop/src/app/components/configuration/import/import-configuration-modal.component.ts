import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfigReader, ConfigurationDocument, Document } from 'idai-field-core';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import { M } from '../../messages/m';
import { Messages } from '../../messages/messages';

const PouchDB = typeof window !== 'undefined' ? window.require('pouchdb-browser') : require('pouchdb-node');


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
        reindexConfiguration?: boolean) => Promise<ConfigurationDocument>;

    public selectedProject: string;


    constructor(public activeModal: NgbActiveModal,
                private configReader: ConfigReader,
                private settingsProvider: SettingsProvider,
                private messages: Messages) {}


    public selectProject = (project: string) => this.selectedProject = project;

    public getProjects = () => this.settingsProvider.getSettings().dbs.slice(1).filter(db => db !== 'test');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public async confirm() {

        if (!this.selectedProject) return;

        try {
            this.activeModal.close(await this.performImport());
        } catch (err) {
            this.messages.add([M.CONFIGURATION_ERROR_IMPORT_FAILURE]);
        }
    }


    private async performImport(): Promise<ConfigurationDocument> {

        const configurationDocumentToImport: ConfigurationDocument
            = await this.fetchConfigurationDocument(this.selectedProject);
        
        const clonedConfigurationDocument = Document.clone(this.configurationDocument);
        clonedConfigurationDocument.resource = configurationDocumentToImport.resource;
        
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
}

import { Injectable } from '@angular/core';
import { AppConfigurator, DocumentConverter, ConfigReader, ConfigurationDocument, DocumentCache, Indexer, IndexFacade,
    PouchdbDatastore, ProjectConfiguration, Document } from 'idai-field-core';
import { SampleDataLoader } from './datastore/field/sampledata/sample-data-loader';
import { ThumbnailGenerator } from './imagestore/thumbnail-generator';
import { ImagesState } from '../components/image/overview/view/images-state';
import { ResourcesStateManager } from '../components/resources/view/resources-state-manager';
import { Settings } from './settings/settings';
import { SettingsProvider } from './settings/settings-provider';
import { TabManager } from './tabs/tab-manager';
import { ConfigurationIndex } from './configuration/index/configuration-index';
import { ConfigurationState } from '../components/configuration/configuration-state';
import { Messages } from '../components/messages/messages';
import { M } from '../components/messages/m';
import { ImageDocumentsManager } from '../components/image/overview/view/image-documents-manager';

const ipcRenderer = typeof window !== 'undefined'
    ? window.require('electron').ipcRenderer
    : require('electron').ipcRenderer;


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * 
 * Called from e2e tests
 */
export class AppController {

    constructor(private resourcesState: ResourcesStateManager,
                private imagesState: ImagesState,
                private configurationState: ConfigurationState,
                private documentCache: DocumentCache,
                private indexFacade: IndexFacade,
                private thumbnailGenerator: ThumbnailGenerator,
                private pouchdbDatastore: PouchdbDatastore,
                private settingsProvider: SettingsProvider,
                private tabManager: TabManager,
                private imageDocumentsManager: ImageDocumentsManager,
                private projectConfiguration: ProjectConfiguration,
                private configurationIndex: ConfigurationIndex,
                private configReader: ConfigReader,
                private appConfigurator: AppConfigurator,
                private messages: Messages) {}

    
    public initialize() {

        ipcRenderer.on('resetApp', async () => {
            await this.reset();
            this.messages.add([M.APP_CONTROLLER_SUCCESS]);
        });

        ipcRenderer.on('createNonUniqueIdentifierWarning', async () => {
            await this.createNonUniqueIdentifierWarning();
            this.messages.add([M.APP_CONTROLLER_SUCCESS]);
        });

        ipcRenderer.on('createConflict', async () => {
            await this.createConflict();
            this.messages.add([M.APP_CONTROLLER_SUCCESS]);
        });

        ipcRenderer.on('createMissingRelationTargetWarning', async () => {
            await this.createMissingRelationTargetWarning();
            this.messages.add([M.APP_CONTROLLER_SUCCESS]);
        });
    }


    private async createNonUniqueIdentifierWarning() {

        const document: Document = this.createDocument();

        await this.pouchdbDatastore.create(document, 'test');

        document._id = '2';
        document.resource.id = '2';

        await this.pouchdbDatastore.create(document, 'test');

        await Indexer.reindex(
            this.indexFacade,
            this.pouchdbDatastore.getDb(),
            this.documentCache,
            new DocumentConverter(this.projectConfiguration),
            this.projectConfiguration,
            false
        );
    }


    private async createConflict() {

        let document: Document = this.createDocument();
        
        document = await this.pouchdbDatastore.create(document, 'test');
        
        try {
            document.resource.shortDescription = 'A';
            await this.pouchdbDatastore.update(document, 'test');
            document.resource.shortDescription = 'B';
            await this.pouchdbDatastore.update(document, 'test');
        } catch (err) {
            // Ignore conflict errors
        }

        await Indexer.reindex(
            this.indexFacade,
            this.pouchdbDatastore.getDb(),
            this.documentCache,
            new DocumentConverter(this.projectConfiguration),
            this.projectConfiguration,
            false
        );
    }


    private async createMissingRelationTargetWarning() {

        let document: Document = this.createDocument();
        document.resource.relations.liesWithin = ['missing'];
        await this.pouchdbDatastore.create(document, 'test');

        await Indexer.reindex(
            this.indexFacade,
            this.pouchdbDatastore.getDb(),
            this.documentCache,
            new DocumentConverter(this.projectConfiguration),
            this.projectConfiguration,
            false
        );
    }


    private async reset() {

        await this.pouchdbDatastore.destroyDb('test');

        const db = this.pouchdbDatastore.createDbForTesting('test');
        this.pouchdbDatastore.setDb_e2e(db);

        this.resourcesState.resetForE2E();
        this.imagesState.resetForE2E();
        this.configurationState.resetForE2E();
        this.tabManager.resetForE2E();
        this.imageDocumentsManager.clearSelection();
        this.documentCache.reset();

        const configurationDocument: ConfigurationDocument = await ConfigurationDocument.getConfigurationDocument(
            (id: string) => db.get(id), this.configReader, 'test', 'test-user'
        );

        this.projectConfiguration.update(await this.appConfigurator.go('test', configurationDocument));

        await new SampleDataLoader(
            this.thumbnailGenerator,
            this.settingsProvider.getSettings().imagestorePath,
            Settings.getLocale()
        ).go(db, this.settingsProvider.getSettings().selectedProject);

        await Indexer.reindex(
            this.indexFacade,
            db,
            this.documentCache,
            new DocumentConverter(this.projectConfiguration),
            this.projectConfiguration,
            false
        );

        await this.configurationIndex.rebuild(configurationDocument);
    }


    private createDocument(): Document {

        return {
            _id: '1',
            resource: {
                id: '1',
                identifier: '1',
                category: 'Place',
                relations: {}
            },
            created: { date: new Date(), user: 'test' },
            modified: []
        };
    }
}

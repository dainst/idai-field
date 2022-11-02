import { Injectable } from '@angular/core';
import { CategoryConverter, ConfigReader, ConfigurationDocument, DocumentCache, Indexer, IndexFacade,
    PouchdbDatastore, ProjectConfiguration } from 'idai-field-core';
import { SampleDataLoader } from './datastore/field/sampledata/sample-data-loader';
import { ThumbnailGenerator } from './imagestore/thumbnail-generator';
import { ImagesState } from '../components/image/overview/view/images-state';
import { ResourcesStateManager } from '../components/resources/view/resources-state-manager';
import { Settings } from './settings/settings';
import { SettingsProvider } from './settings/settings-provider';
import { TabManager } from './tabs/tab-manager';
import { ConfigurationIndex } from './configuration/index/configuration-index';
import { ConfigurationState } from '../components/configuration/configuration-state';

const ipcRenderer = typeof window !== 'undefined'
    ? window.require('electron').ipcRenderer
    : require('electron').ipcRenderer;


@Injectable()
/**
 * @author Daniel de Oliveira
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
                private projectConfiguration: ProjectConfiguration,
                private configurationIndex: ConfigurationIndex,
                private configReader: ConfigReader) {}

    
    public initialize() {

        ipcRenderer.on('resetApp', async () => await this.reset());
    }


    private async reset() {

        await this.pouchdbDatastore.destroyDb('test');

        const db = this.pouchdbDatastore.createDbForTesting('test');
        this.pouchdbDatastore.setDb_e2e(db);

        this.resourcesState.resetForE2E();
        this.imagesState.resetForE2E();
        this.configurationState.resetForE2E();
        this.tabManager.resetForE2E();
        this.documentCache.reset();

        await new SampleDataLoader(
            this.thumbnailGenerator,
            this.settingsProvider.getSettings().imagestorePath,
            Settings.getLocale()
        ).go(db,this.settingsProvider.getSettings().selectedProject);

        await Indexer.reindex(
            this.indexFacade,
            db,
            this.documentCache,
            new CategoryConverter(this.projectConfiguration),
            false
        );

        const configurationDocument: ConfigurationDocument = await ConfigurationDocument.getConfigurationDocument(
            (id: string) => db.get(id), this.configReader, 'test', 'test-user'
        );

        await this.configurationIndex.rebuild(configurationDocument);
    }
}

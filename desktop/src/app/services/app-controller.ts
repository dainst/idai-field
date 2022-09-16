import { Injectable } from '@angular/core';
import { CategoryConverter, ConfigReader, ConfigurationDocument, DocumentCache, ImageStore, Indexer, IndexFacade,
    PouchdbDatastore, ProjectConfiguration } from 'idai-field-core';
import { MenuNavigator } from '../components/menu-navigator';
import { SampleDataLoader } from './datastore/field/sampledata/sample-data-loader';
import { ThumbnailGenerator } from './imagestore/thumbnail-generator';
import { ImagesState } from '../components/image/overview/view/images-state';
import { ResourcesStateManager } from '../components/resources/view/resources-state-manager';
import { Settings } from './settings/settings';
import { SettingsProvider } from './settings/settings-provider';
import { TabManager } from './tabs/tab-manager';
import { ConfigurationIndex } from './configuration/index/configuration-index';
import { ConfigurationState } from '../components/configuration/configuration-state';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const express = typeof window !== 'undefined' ? window.require('express') : require('express');


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
                private imagestore: ImageStore,
                private settingsProvider: SettingsProvider,
                private tabManager: TabManager,
                private projectConfiguration: ProjectConfiguration,
                private menuNavigator: MenuNavigator,
                private configurationIndex: ConfigurationIndex,
                private configReader: ConfigReader) {}


    public setupServer(): Promise<any> {

        return new Promise(resolve => {

            if (!remote.getGlobal('switches').provide_reset) return resolve(undefined);

            const control = express();
            control.use(express.json());

            control.post('/reset', async (request: any, result: any) => {
                await this.reset();
                result.send('done');
            });

            control.post('/navigate', async (request: any, result: any) => {
                await this.menuNavigator.onMenuItemClicked(request.body.menu);
                result.send('done');
            });

            control.listen(3003, function() {
                console.log('App Control listening on port 3003');
                resolve(undefined);
            });
        });
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

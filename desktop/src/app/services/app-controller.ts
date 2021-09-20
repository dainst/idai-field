import { Injectable } from '@angular/core';
import { CategoryConverter, DocumentCache, Indexer, IndexFacade, PouchdbDatastore, ProjectConfiguration } from 'idai-field-core';
import { MenuNavigator } from '../components/menu-navigator';
import { SampleDataLoader } from './datastore/field/sampledata/sample-data-loader';
import { ImageConverter } from './imagestore/image-converter';
import { Imagestore } from './imagestore/imagestore';
import { ImagesState } from '../components/image/overview/view/images-state';
import { ResourcesStateManager } from '../components/resources/view/resources-state-manager';
import { Settings } from './settings/settings';
import { SettingsProvider } from './settings/settings-provider';
import { TabManager } from './tabs/tab-manager';
import {Menus} from './menus';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const express = typeof window !== 'undefined' ? window.require('express') : require('express');


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class AppController {

    constructor(private resourcesState: ResourcesStateManager,
                private documentCache: DocumentCache,
                private imagesState: ImagesState,
                private indexFacade: IndexFacade,
                private imageConverter: ImageConverter,
                private pouchdbDatastore: PouchdbDatastore,
                private imagestore: Imagestore,
                private settingsProvider: SettingsProvider,
                private tabManager: TabManager,
                private projectConfiguration: ProjectConfiguration,
                private menuService: Menus,
                private menuNavigator: MenuNavigator) {}


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
        this.imagestore.setDb(db);

        this.resourcesState.resetForE2E();
        this.imagesState.resetForE2E();
        this.tabManager.resetForE2E();
        this.documentCache.resetForE2E();

        await new SampleDataLoader(
            this.imageConverter,
            this.settingsProvider.getSettings().imagestorePath,
            Settings.getLocale())
            .go(db,this.settingsProvider.getSettings().selectedProject);

        await Indexer.reindex(
            this.indexFacade,
            db,
            this.documentCache,
            new CategoryConverter(this.projectConfiguration)
        );
    }
}

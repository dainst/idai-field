import { ConstraintIndex, Document, DocumentCache, FulltextIndex, Indexer, IndexFacade } from 'idai-field-core';
import { AngularUtility } from '../angular/angular-utility';
import { ProjectConfiguration } from '../core/configuration/project-configuration';
import { FieldCategoryConverter } from '../core/datastore/field/field-category-converter';
import { PouchdbManager } from '../core/datastore/pouchdb/pouchdb-manager';
import { PouchdbServer } from '../core/datastore/pouchdb/pouchdb-server';
import { InitializationProgress } from '../core/initialization-progress';
import { Settings } from '../core/settings/settings';
import { SettingsSerializer } from '../core/settings/settings-serializer';
import { SettingsService } from '../core/settings/settings-service';
import { IndexerConfiguration } from '../indexer-configuration';


const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;


export class AppInitializerServiceLocator {

    private _projectConfiguration: ProjectConfiguration;
    private _fulltextIndex: FulltextIndex;
    private _constraintIndex: ConstraintIndex;
    private _indexFacade: IndexFacade;


    public get projectConfiguration(): ProjectConfiguration {
        if (!this._projectConfiguration) {
            console.error('project configuration has not yet been provided');
            throw 'project configuration has not yet been provided';
        }
        return this._projectConfiguration;
    }


    public set projectConfiguration(value: ProjectConfiguration | undefined) {
        this._projectConfiguration = value;
    }


    public get fulltextIndex(): FulltextIndex {
        if (!this._fulltextIndex) {
            console.error('fulltext index has not yet been provided');
            throw 'fulltext index has not yet been provided';
        }
        return this._fulltextIndex;
    }


    public set fulltextIndex(value: FulltextIndex | undefined) {
        this._fulltextIndex = value;
    }


    public get constraintIndex(): ConstraintIndex {
        if (!this._constraintIndex) {
            console.error('constraint index has not yet been provided');
            throw 'constraint index has not yet been provided';
        }
        return this._constraintIndex;
    }


    public set constraintIndex(value: ConstraintIndex | undefined) {
        this._constraintIndex = value;
    }


    public get indexFacade(): IndexFacade {
        if (!this._indexFacade) {
            console.error('index facade has not yet been provided');
            throw 'index facade has not yet been provided';
        }
        return this._indexFacade;
    }


    public set indexFacade(value: IndexFacade | undefined) {
        this._indexFacade = value;
    }
}


export const appInitializerFactory = (
        serviceLocator: AppInitializerServiceLocator,
        settingsService: SettingsService,
        pouchdbManager: PouchdbManager,
        pouchdbServer: PouchdbServer,
        documentCache: DocumentCache<Document>,
        progress: InitializationProgress
    ) => (): Promise<void> => {

    return pouchdbServer.setupServer()
        .then(() => progress.setPhase('loadingSettings'))
        .then(() => (new SettingsSerializer).load())
        .then(settings => progress.setEnvironment(settings.dbs[0], Settings.getLocale()).then(() =>
            settingsService.bootProjectDb(settings, progress).then(() =>
                settingsService.loadConfiguration(remote.getGlobal('configurationDirPath'), progress))))
        .then(configuration => {
            serviceLocator.projectConfiguration = configuration;

            const { createdConstraintIndex, createdFulltextIndex, createdIndexFacade } =
                IndexerConfiguration.configureIndexers(configuration);
            serviceLocator.constraintIndex = createdConstraintIndex;
            serviceLocator.fulltextIndex = createdFulltextIndex;
            return createdIndexFacade;
            }).then(async facade => {
                serviceLocator.indexFacade = facade;
                progress.setDocumentsToIndex((await pouchdbManager.getDb().info()).doc_count);
                progress.setPhase('loadingDocuments');
                return Indexer.reindex(facade, pouchdbManager.getDb(), documentCache,
                new FieldCategoryConverter(serviceLocator.projectConfiguration),
                (count) => progress.setIndexedDocuments(count),
                () => progress.setPhase('indexingDocuments'),
                (error) => progress.setError(error)
                );
        }).then(() => AngularUtility.refresh(700));
};

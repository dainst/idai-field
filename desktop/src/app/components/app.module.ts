import { DecimalPipe, HashLocationStrategy, LocationStrategy, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import localeIt from '@angular/common/locales/it';
import { APP_INITIALIZER, LOCALE_ID, NgModule, TRANSLATIONS, TRANSLATIONS_FORMAT } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { ConstraintIndex, Document, DocumentCache, FulltextIndex, Indexer, IndexFacade, Query } from 'idai-field-core';
import { AngularUtility } from '../angular/angular-utility';
import { Translations } from '../angular/translations';
import { AppController } from '../core/app-controller';
import { StateSerializer } from '../core/common/state-serializer';
import { AppConfigurator } from '../core/configuration/app-configurator';
import { ConfigLoader } from '../core/configuration/boot/config-loader';
import { ConfigReader } from '../core/configuration/boot/config-reader';
import { ProjectConfiguration } from '../core/configuration/project-configuration';
import { DatastoreModule } from '../core/datastore/datastore.module';
import { DocumentDatastore } from '../core/datastore/document-datastore';
import { FieldCategoryConverter } from '../core/datastore/field/field-category-converter';
import { FieldDatastore } from '../core/datastore/field/field-datastore';
import { PouchdbManager } from '../core/datastore/pouchdb/pouchdb-manager';
import { PouchdbServer } from '../core/datastore/pouchdb/pouchdb-server';
import { BlobMaker } from '../core/images/imagestore/blob-maker';
import { ImageConverter } from '../core/images/imagestore/image-converter';
import { Imagestore } from '../core/images/imagestore/imagestore';
import { PouchDbFsImagestore } from '../core/images/imagestore/pouch-db-fs-imagestore';
import { ReadImagestore } from '../core/images/imagestore/read-imagestore';
import { ImportValidator } from '../core/import/import/process/import-validator';
import { InitializationProgress } from '../core/initialization-progress';
import { ImageRelationsManager } from '../core/model/image-relations-manager';
import { RelationsManager } from '../core/model/relations-manager';
import { Validator } from '../core/model/validator';
import { Settings } from '../core/settings/settings';
import { SettingsProvider } from '../core/settings/settings-provider';
import { SettingsSerializer } from '../core/settings/settings-serializer';
import { SettingsService } from '../core/settings/settings-service';
import { SyncService } from '../core/sync/sync-service';
import { TabManager } from '../core/tabs/tab-manager';
import { TabSpaceCalculator } from '../core/tabs/tab-space-calculator';
import { UtilTranslations } from '../core/util/util-translations';
import { IndexerConfiguration } from '../indexer-configuration';
import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { BackupModule } from './backup/backup.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { ExportModule } from './export/export.module';
import { HelpComponent } from './help/help.component';
import { ImageOverviewModule } from './image/overview/image-overview.module';
import { ImportModule } from './import/import-module';
import { MatrixModule } from './matrix/matrix.module';
import { MenuService } from './menu-service';
import { IdaiMessagesModule } from './messages/idai-messages.module';
import { M } from './messages/m';
import { MD } from './messages/md';
import { Messages } from './messages/messages';
import { NavbarComponent } from './navbar/navbar.component';
import { ProjectsModalComponent } from './navbar/projects-modal.component';
import { ProjectsComponent } from './navbar/projects.component';
import { TaskbarConflictsComponent } from './navbar/taskbar-conflicts.component';
import { TaskbarSyncStatusComponent } from './navbar/taskbar-sync-status.component';
import { TaskbarUpdateComponent } from './navbar/taskbar-update.component';
import { TaskbarComponent } from './navbar/taskbar.component';
import { ResourcesModule } from './resources/resources.module';
import { SettingsModule } from './settings/settings.module';
import { ViewModalModule } from './viewmodal/view-modal.module';
import { WidgetsModule } from './widgets/widgets.module';

const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;

let projectConfiguration: ProjectConfiguration|undefined = undefined;
let fulltextIndex: FulltextIndex|undefined = undefined;
let constraintIndex: ConstraintIndex|undefined = undefined;
let indexFacade: IndexFacade|undefined = undefined;


registerLocaleData(localeDe, 'de');
registerLocaleData(localeIt, 'it');


@NgModule({
    imports: [
        ViewModalModule,
        ImageOverviewModule,
        ResourcesModule,
        SettingsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        NgbModule,
        // NgbModule.forRoot(),
        IdaiMessagesModule,
        routing,
        WidgetsModule,
        ImportModule,
        ExportModule,
        BackupModule,
        DatastoreModule,
        MatrixModule,
        ConfigurationModule
    ],
    declarations: [
        AppComponent,
        NavbarComponent,
        TaskbarComponent,
        TaskbarConflictsComponent,
        TaskbarSyncStatusComponent,
        TaskbarUpdateComponent,
        ProjectsComponent,
        ProjectsModalComponent,
        HelpComponent
    ],
    providers: [
        DecimalPipe,
        { provide: LOCALE_ID, useValue: remote.getGlobal('getLocale')() },
        { provide: TRANSLATIONS, useValue: Translations.getTranslations() },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
        I18n,
        ConfigReader,
        ConfigLoader,
        AppConfigurator,
        SettingsProvider,
        SettingsService,
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [SettingsService, PouchdbManager, PouchdbServer, DocumentCache, InitializationProgress],
            useFactory: (settingsService: SettingsService, pouchdbManager: PouchdbManager, pouchdbServer: PouchdbServer, documentCache: DocumentCache<Document>, progress: InitializationProgress) => () =>

                pouchdbServer.setupServer()
                    .then(() => progress.setPhase('loadingSettings'))
                    .then(() => (new SettingsSerializer).load())
                    .then(settings => progress.setEnvironment(settings.dbs[0], Settings.getLocale()).then(() =>
                        settingsService.bootProjectDb(settings, progress).then(() =>
                            settingsService.loadConfiguration(remote.getGlobal('configurationDirPath'), progress))))
                    .then(configuration => {
                        projectConfiguration = configuration;

                        const { createdConstraintIndex, createdFulltextIndex, createdIndexFacade } =
                            IndexerConfiguration.configureIndexers(projectConfiguration);
                        constraintIndex = createdConstraintIndex;
                        fulltextIndex = createdFulltextIndex;
                        return createdIndexFacade;
                     }).then(async facade => {
                         indexFacade = facade;
                         progress.setDocumentsToIndex((await pouchdbManager.getDb().info()).doc_count);
                         progress.setPhase('loadingDocuments');
                         return Indexer.reindex(indexFacade, pouchdbManager.getDb(), documentCache,
                            new FieldCategoryConverter(projectConfiguration),
                            (count) => progress.setIndexedDocuments(count),
                            () => progress.setPhase('indexingDocuments'),
                            (error) => progress.setError(error)
                         );
                    }).then(() => AngularUtility.refresh(700))
        },
        InitializationProgress,
        {
            provide: Messages,
            useFactory: function(md: MD) {
                return new Messages(md, remote.getGlobal('switches').messages_timeout);
            },
            deps: [MD]
        },
        {
            provide: Imagestore,
            useFactory: function(pouchdbManager: PouchdbManager, converter: ImageConverter, blobMaker: BlobMaker) {
                return new PouchDbFsImagestore(converter, blobMaker, pouchdbManager.getDb());
            },
            deps: [PouchdbManager, ImageConverter, BlobMaker]
        },
        { provide: ReadImagestore, useExisting: Imagestore },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        BlobMaker,
        ImageConverter,
        AppController,
        {
            provide: ProjectConfiguration,
            useFactory: () => {
                if (!projectConfiguration) {
                    console.error('project configuration has not yet been provided');
                    throw 'project configuration has not yet been provided';
                }
                return projectConfiguration;
            },
            deps: []
        },
        {
            provide: FulltextIndex,
            useFactory: () => {
                if (!fulltextIndex) {
                    console.error('fulltext index has not yet been provided');
                    throw 'fulltext index has not yet been provided';
                }
                return fulltextIndex;
            },
            deps: []
        },
        {
            provide: ConstraintIndex,
            useFactory: () => {
                if (!constraintIndex) {
                    console.error('constraint index has not yet been provided');
                    throw 'constraint index has not yet been provided';
                }
                return constraintIndex;
            },
            deps: []
        },
        {
            provide: IndexFacade,
            useFactory: () => {
                if (!indexFacade) {
                    console.error('index facade has not yet been provided');
                    throw 'index facade has not yet been provided';
                }
                return indexFacade;
            },
            deps: []
        },
        RelationsManager,
        ImageRelationsManager,
        {
            provide: Validator,
            useFactory: (
                DocumentDatastore: DocumentDatastore,
                projectConfiguration: ProjectConfiguration) => {

                return new Validator(
                    projectConfiguration,
                    (q: Query) => DocumentDatastore.find(q),
                )
            },
            deps: [DocumentDatastore, ProjectConfiguration]
        },
        ImportValidator,
        { provide: MD, useClass: M},
        SyncService,
        {
            provide: TabManager,
            useFactory: (
                indexFacade: IndexFacade,
                tabSpaceCalculator: TabSpaceCalculator,
                stateSerializer: StateSerializer,
                datastore: FieldDatastore,
                router: Router
            ) => {
                const tabManager = new TabManager(
                    indexFacade, tabSpaceCalculator, stateSerializer, datastore,
                    async (path: string[]) => { await router.navigate(path) });
                router.events.subscribe(async () => { await tabManager.routeChanged(router.url) });
                return tabManager;
            },
            deps: [IndexFacade, TabSpaceCalculator, StateSerializer, FieldDatastore, Router]
        },
        TabSpaceCalculator,
        MenuService,
        UtilTranslations
    ],
    entryComponents: [
        ProjectsModalComponent
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }

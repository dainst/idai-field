import { DecimalPipe, HashLocationStrategy, LocationStrategy, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import localeIt from '@angular/common/locales/it';
import { APP_INITIALIZER, LOCALE_ID, NgModule, TRANSLATIONS, TRANSLATIONS_FORMAT } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { I18n } from '@ngx-translate/i18n-polyfill';
import {
    AppConfigurator,
    ConfigLoader,
    ConfigReader,
    ConstraintIndex,
    Datastore,
    DocumentCache,
    FulltextIndex,
    IndexFacade,
    PouchdbDatastore,
    ProjectConfiguration,
    Query,
    RelationsManager,
    SyncService,
    Labels,
    Imagestore
} from 'idai-field-core';
import { Translations } from '../angular/translations';
import { AppController } from '../services/app-controller';
import { StateSerializer } from '../services/state-serializer';
import { DatastoreModule } from '../services/datastore/datastore.module';
import { ExpressServer } from '../services/express-server';
import { ImageUrlMaker } from '../services/imagestore/image-url-maker';
import { ThumbnailGenerator } from '../services/imagestore/thumbnail-generator';
import { ImportValidator } from '../components/import/import/process/import-validator';
import { InitializationProgress } from './initialization-progress';
import { ImageRelationsManager } from '../services/image-relations-manager';
import { Validator } from '../model/validator';
import { SettingsProvider } from '../services/settings/settings-provider';
import { SettingsService } from '../services/settings/settings-service';
import { TabManager } from '../services/tabs/tab-manager';
import { TabSpaceCalculator } from '../services/tabs/tab-space-calculator';
import { appInitializerFactory, AppInitializerServiceLocator } from './app-initializer';
import { AppComponent } from './app.component';
import { routing } from './app.routing';
import { BackupModule } from './backup/backup.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { ExportModule } from './export/export.module';
import { HelpComponent } from './help/help.component';
import { ImageOverviewModule } from './image/overview/image-overview.module';
import { ImportModule } from './import/import-module';
import { MatrixModule } from './matrix/matrix.module';
import { Menus } from '../services/menus';
import { IdaiMessagesModule } from './messages/idai-messages.module';
import { M } from './messages/m';
import { MD } from './messages/md';
import { Messages } from './messages/messages';
import { Modals } from '../services/modals';
import { Languages } from '../services/languages';
import { NavbarComponent } from './navbar/navbar.component';
import { ProjectsComponent } from './navbar/projects.component';
import { TaskbarConflictsComponent } from './navbar/taskbar-conflicts.component';
import { TaskbarSyncStatusComponent } from './navbar/taskbar-sync-status.component';
import { TaskbarUpdateComponent } from './navbar/taskbar-update.component';
import { TaskbarComponent } from './navbar/taskbar.component';
import { ResourcesModule } from './resources/resources.module';
import { SettingsModule } from './settings/settings.module';
import { ViewModalModule } from './viewmodal/view-modal.module';
import { WidgetsModule } from './widgets/widgets.module';
import {UtilTranslations} from '../util/util-translations';
import { MenuNavigator } from './menu-navigator';
import { ProjectModule } from './project/project.module';
import { RemoteFilestore } from '../services/filestore/remote-filestore';
import { FsAdapter } from '../services/imagestore/fs-adapter';
import { HttpAdapter } from '../services/filestore/http-adapter';
import { ImageSync } from '../services/imagestore/image-sync';
import { RemoteImageStore } from '../services/imagestore/remote-image-store';


const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


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
        ConfigurationModule,
        ProjectModule
    ],
    declarations: [
        AppComponent,
        NavbarComponent,
        TaskbarComponent,
        TaskbarConflictsComponent,
        TaskbarSyncStatusComponent,
        TaskbarUpdateComponent,
        ProjectsComponent,
        HelpComponent,
    ],
    providers: [
        Modals,
        Languages,
        {
            provide: Labels,
            useFactory: (languages: Languages) => new Labels(() => languages.get()),
            deps: [Languages]
        },
        DecimalPipe,
        { provide: LOCALE_ID, useValue: remote.getGlobal('getLocale')() },
        { provide: TRANSLATIONS, useValue: Translations.getTranslations() },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
        I18n,
        {
            provide: ConfigReader,
            useFactory: () => new ConfigReader()
        },
        {
            provide: ConfigLoader,
            useFactory: (configReader: ConfigReader, pouchdbDatastore: PouchdbDatastore) => {
                return new ConfigLoader(configReader, pouchdbDatastore);
            },
            deps: [ConfigReader, PouchdbDatastore]
        },
        {
            provide: AppConfigurator,
            useFactory: (configLoader: ConfigLoader) => new AppConfigurator(configLoader),
            deps: [ConfigLoader]
        },
        SettingsProvider,
        SettingsService,
        ImageSync,
        {
            provide: AppInitializerServiceLocator,
            useFactory: () => new AppInitializerServiceLocator()
        },
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [
                AppInitializerServiceLocator,
                SettingsService,
                PouchdbDatastore,
                ExpressServer,
                DocumentCache,
                ThumbnailGenerator,
                Imagestore,
                InitializationProgress
            ],
            useFactory: appInitializerFactory,
        },
        InitializationProgress,
        {
            provide: Messages,
            useFactory: (md: MD) => {
                return new Messages(md, remote.getGlobal('switches').messages_timeout);
            },
            deps: [MD]
        },
        {
            provide: FsAdapter,
            useFactory: (settingsProvider: SettingsProvider) => {
                return new FsAdapter(settingsProvider);
            },
            deps: [SettingsProvider]
        },
        {
            provide: Imagestore,
            useFactory: (filesystemAdapter: FsAdapter, converter: ThumbnailGenerator) => {
                return new Imagestore(filesystemAdapter, converter);
            },
            deps: [FsAdapter, ThumbnailGenerator]
        },
        {
            provide: RemoteImageStore,
            useFactory: (settingsProvider: SettingsProvider) => {
                return new RemoteImageStore(settingsProvider);
            },
            deps: [SettingsProvider]
        },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        ImageUrlMaker,
        ThumbnailGenerator,
        AppController,
        {
            provide: ProjectConfiguration,
            useFactory: (serviceLocator: AppInitializerServiceLocator) => serviceLocator.projectConfiguration,
            deps: [AppInitializerServiceLocator]
        },
        {
            provide: FulltextIndex,
            useFactory: (serviceLocator: AppInitializerServiceLocator) => serviceLocator.fulltextIndex,
            deps: [AppInitializerServiceLocator]
        },
        {
            provide: ConstraintIndex,
            useFactory: (serviceLocator: AppInitializerServiceLocator) => serviceLocator.constraintIndex,
            deps: [AppInitializerServiceLocator]
        },
        {
            provide: IndexFacade,
            useFactory: (serviceLocator: AppInitializerServiceLocator) => serviceLocator.indexFacade,
            deps: [AppInitializerServiceLocator]
        },
        {
            provide: RelationsManager,
            useFactory: (
                datastore: Datastore,
                projectConfiguration: ProjectConfiguration,
            ) => new RelationsManager(datastore, projectConfiguration),
            deps: [Datastore, ProjectConfiguration]
        },
        HttpAdapter,
        RemoteFilestore,
        ImageRelationsManager,
        {
            provide: Validator,
            useFactory: (
                DocumentDatastore: Datastore,
                projectConfiguration: ProjectConfiguration) => {

                return new Validator(
                    projectConfiguration,
                    (q: Query) => DocumentDatastore.find(q),
                );
            },
            deps: [Datastore, ProjectConfiguration]
        },
        ImportValidator,
        { provide: MD, useClass: M},
        {
            provide: SyncService,
            useFactory: (pouchdbDatastore: PouchdbDatastore) => new SyncService(pouchdbDatastore),
            deps: [PouchdbDatastore]
        },
        {
            provide: TabManager,
            useFactory: (
                indexFacade: IndexFacade,
                tabSpaceCalculator: TabSpaceCalculator,
                stateSerializer: StateSerializer,
                datastore: Datastore,
                router: Router
            ) => {
                const tabManager = new TabManager(
                    indexFacade, tabSpaceCalculator, stateSerializer, datastore,
                    async (path: string[]) => {
                        await router.navigate(path);
                    });
                router.events.subscribe(async () => {
                    await tabManager.routeChanged(router.url);
                });
                return tabManager;
            },
            deps: [IndexFacade, TabSpaceCalculator, StateSerializer, Datastore, Router]
        },
        TabSpaceCalculator,
        Menus,
        MenuNavigator,
        UtilTranslations
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }

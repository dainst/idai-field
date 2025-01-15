import { DecimalPipe, HashLocationStrategy, IMAGE_CONFIG, LocationStrategy, registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import localeIt from '@angular/common/locales/it';
import localePt from '@angular/common/locales/pt';
import localeTr from '@angular/common/locales/tr';
import localeUk from '@angular/common/locales/uk';
import { LOCALE_ID, NgModule, TRANSLATIONS, TRANSLATIONS_FORMAT, inject, provideAppInitializer } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppConfigurator, ConfigLoader, ConfigReader, ConstraintIndex, Datastore, DocumentCache, FulltextIndex,
    IndexFacade, PouchdbDatastore, ProjectConfiguration, Query, RelationsManager, SyncService, Labels,
    ImageStore, ImageSyncService, ConfigurationSerializer } from 'idai-field-core';
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
import { ImportModule } from './import/import.module';
import { MatrixModule } from './matrix/matrix.module';
import { Menus } from '../services/menus';
import { MessagesModule } from './messages/messages.module';
import { M } from './messages/m';
import { MD } from './messages/md';
import { Messages } from './messages/messages';
import { Modals } from '../services/modals';
import { Languages } from '../services/languages';
import { ResourcesModule } from './resources/resources.module';
import { SettingsModule } from './settings/settings.module';
import { ViewModalModule } from './viewmodal/view-modal.module';
import { WidgetsModule } from './widgets/widgets.module';
import { UtilTranslations } from '../util/util-translations';
import { MenuNavigator } from './menu-navigator';
import { ProjectModule } from './project/project.module';
import { FsAdapter } from '../services/imagestore/fs-adapter';
import { RemoteImageStore } from '../services/imagestore/remote-image-store';
import { ConfigurationIndex } from '../services/configuration/index/configuration-index';
import { MenuModalLauncher } from '../services/menu-modal-launcher';
import { ViewModalLauncher } from './viewmodal/view-modal-launcher';
import { NavbarModule } from './navbar/navbar.module';
import { WarningsService } from '../services/warnings/warnings-service';
import { ProjectLabelProvider } from '../services/project-label-provider';
import { AppState } from '../services/app-state';


const remote = window.require('@electron/remote');


registerLocaleData(localeDe, 'de');
registerLocaleData(localeIt, 'it');
registerLocaleData(localePt, 'pt');
registerLocaleData(localeTr, 'tr');
registerLocaleData(localeUk, 'uk');


@NgModule({
    imports: [
        ViewModalModule,
        ImageOverviewModule,
        ResourcesModule,
        SettingsModule,
        BrowserModule,
        FormsModule,
        NgbModule,
        // NgbModule.forRoot(),
        MessagesModule,
        routing,
        WidgetsModule,
        ImportModule,
        ExportModule,
        BackupModule,
        DatastoreModule,
        MatrixModule,
        ConfigurationModule,
        ProjectModule,
        NavbarModule
    ],
    declarations: [
        AppComponent,
        HelpComponent
    ],
    providers: [
        Modals,
        Languages,
        {
            provide: Labels,
            useFactory: (languages: Languages) => {
                return new Labels(() => languages.get());
            },
            deps: [Languages]
        },
        DecimalPipe,
        { provide: LOCALE_ID, useValue: remote.getGlobal('getLocale')() },
        { provide: TRANSLATIONS, useValue: Translations.getTranslations() },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
        {
            provide: ConfigReader,
            useFactory: () => new ConfigReader()
        },
        {
            provide: ConfigLoader,
            useFactory: (configReader: ConfigReader) => new ConfigLoader(configReader),
            deps: [ConfigReader, PouchdbDatastore]
        },
        {
            provide: AppConfigurator,
            useFactory: (configLoader: ConfigLoader) => new AppConfigurator(configLoader),
            deps: [ConfigLoader]
        },
        {
            provide: ConfigurationSerializer,
            useFactory: (appConfigurator: AppConfigurator) => new ConfigurationSerializer(appConfigurator),
            deps: [AppConfigurator]
        },
        SettingsProvider,
        SettingsService,
        {
            provide: AppInitializerServiceLocator,
            useFactory: () => new AppInitializerServiceLocator()
        },
        provideAppInitializer(() => {
            return appInitializerFactory(
                inject(AppInitializerServiceLocator),
                inject(SettingsService),
                inject(PouchdbDatastore),
                inject(ImageStore),
                inject(ExpressServer),
                inject(DocumentCache),
                inject(ThumbnailGenerator),
                inject(InitializationProgress),
                inject(ConfigReader),
                inject(ConfigLoader)
            )();
        }),
        InitializationProgress,
        {
            provide: Messages,
            useFactory: (md: MD) => {
                return new Messages(md, remote.getGlobal('switches').messages_timeout);
            },
            deps: [MD]
        },
        {
            provide: ImageStore,
            useFactory: (filesystemAdapter: FsAdapter, converter: ThumbnailGenerator) => {
                return new ImageStore(filesystemAdapter, converter);
            },
            deps: [FsAdapter, ThumbnailGenerator]
        },
        {
            provide: RemoteImageStore,
            useFactory: (settingsProvider: SettingsProvider, messages: Messages) => {
                return new RemoteImageStore(settingsProvider, messages);
            },
            deps: [SettingsProvider, Messages]
        },
        {
            provide: ImageSyncService,
            useFactory: (imageStore: ImageStore, remoteImageStore: RemoteImageStore,
                         pouchdbDatastore: PouchdbDatastore) =>
                new ImageSyncService(imageStore, remoteImageStore, pouchdbDatastore),
            deps: [ImageStore, RemoteImageStore, PouchdbDatastore]
        },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        ImageUrlMaker,
        ThumbnailGenerator,
        FsAdapter,
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
            provide: ConfigurationIndex,
            useFactory: (serviceLocator: AppInitializerServiceLocator) => serviceLocator.configurationIndex,
            deps: [AppInitializerServiceLocator]
        },
        {
            provide: RelationsManager,
            useFactory: (
                datastore: Datastore,
                projectConfiguration: ProjectConfiguration
            ) => new RelationsManager(datastore, projectConfiguration),
            deps: [Datastore, ProjectConfiguration]
        },
        ImageRelationsManager,
        {
            provide: Validator,
            useFactory: (DocumentDatastore: Datastore, projectConfiguration: ProjectConfiguration) => {
                return new Validator(projectConfiguration, (q: Query) => DocumentDatastore.find(q));
            },
            deps: [Datastore, ProjectConfiguration]
        },
        ImportValidator,
        { provide: MD, useClass: M },
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
        UtilTranslations,
        WarningsService,
        MenuModalLauncher,
        ViewModalLauncher,
        ProjectLabelProvider,
        AppState,
        { provide: IMAGE_CONFIG, useValue: { disableImageSizeWarning: true, disableImageLazyLoadWarning: true } },
        provideHttpClient(withInterceptorsFromDi())
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}

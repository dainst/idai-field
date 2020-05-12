import {APP_INITIALIZER, LOCALE_ID, NgModule, TRANSLATIONS, TRANSLATIONS_FORMAT} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {DecimalPipe, HashLocationStrategy, LocationStrategy, registerLocaleData} from '@angular/common';
import localeDe from '@angular/common/locales/de';
import {FormsModule} from '@angular/forms';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {Query} from 'idai-components-2';
import {routing} from './app.routing';
import {AppComponent} from './app.component';
import {ResourcesModule} from './resources/resources.module';
import {NavbarComponent} from './navbar/navbar.component';
import {SettingsModule} from './settings/settings.module';
import {SettingsService} from '../core/settings/settings-service';
import {TaskbarComponent} from './navbar/taskbar.component';
import {WidgetsModule} from './widgets/widgets.module';
import {ProjectsComponent} from './navbar/projects.component';
import {ImportModule} from './import/import-module';
import {BackupModule} from './backup/backup.module';
import {AppController} from '../core/app-controller';
import {DatastoreModule} from '../core/datastore/datastore.module';
import {ImageOverviewModule} from './image/overview/image-overview.module';
import {PersistenceManager} from '../core/model/persistence-manager';
import {Validator} from '../core/model/validator';
import {ImportValidator} from '../core/import/import/process/import-validator';
import {MatrixModule} from './matrix/matrix.module';
import {PouchdbManager} from '../core/datastore/pouchdb/pouchdb-manager';
import {PouchdbServer} from '../core/datastore/pouchdb/pouchdb-server';
import {TaskbarConflictsComponent} from './navbar/taskbar-conflicts.component';
import {ProjectCategories} from '../core/configuration/project-categories';
import {UsernameProvider} from '../core/settings/username-provider';
import {IndexFacade} from '../core/datastore/index/index-facade';
import {FulltextIndex} from '../core/datastore/index/fulltext-index';
import {ConstraintIndex} from '../core/datastore/index/constraint-index';
import {HelpComponent} from './help/help.component';
import {TaskbarUpdateComponent} from './navbar/taskbar-update.component';
import {M} from './messages/m';
import {SettingsSerializer} from '../core/settings/settings-serializer';
import {IndexerConfiguration} from '../indexer-configuration';
import {SyncService} from '../core/sync/sync-service';
import {Translations} from '../angular/translations';
import {ExportModule} from './export/export.module';
import {ProjectsModalComponent} from './navbar/projects-modal.component';
import {MenuService} from '../desktop/menu-service';
import {UtilTranslations} from '../core/util/util-translations';
import {ProjectConfiguration} from '../core/configuration/project-configuration';
import {ConfigReader} from '../core/configuration/boot/config-reader';
import {ConfigLoader} from '../core/configuration/boot/config-loader';
import {AppConfigurator} from '../core/configuration/app-configurator';
import {StateSerializer} from '../core/common/state-serializer';
import {FieldReadDatastore} from '../core/datastore/field/field-read-datastore';
import {Router} from '@angular/router';
import {TabManager} from '../core/tabs/tab-manager';
import {TabSpaceCalculator} from '../core/tabs/tab-space-calculator';
import {Imagestore} from '../core/images/imagestore/imagestore';
import {PouchDbFsImagestore} from '../core/images/imagestore/pouch-db-fs-imagestore';
import {ImageConverter} from '../core/images/imagestore/image-converter';
import {BlobMaker} from '../core/images/imagestore/blob-maker';
import {ReadImagestore} from '../core/images/imagestore/read-imagestore';
import {DocumentReadDatastore} from '../core/datastore/document-read-datastore';
import {TaskbarSyncStatusComponent} from './navbar/taskbar-sync-status.component';
import {DescendantsUtility} from '../core/model/descendants-utility';
import {ViewModalModule} from './viewmodal/view-modal.module';
import {ConfigurationModule} from './configuration/configuration.module';
import {IdaiMessagesModule} from './messages/idai-messages.module';
import {MD} from './messages/md';
import {Messages} from './messages/messages';


const remote = window.require('electron').remote;

let projectConfiguration: ProjectConfiguration|undefined = undefined;
let fulltextIndex: FulltextIndex|undefined = undefined;
let constraintIndex: ConstraintIndex|undefined = undefined;
let indexFacade: IndexFacade|undefined = undefined;


registerLocaleData(localeDe, 'de');


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
        { provide: LOCALE_ID, useValue: remote.getGlobal('config').locale },
        { provide: TRANSLATIONS, useValue: Translations.getTranslations() },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
        I18n,
        ConfigReader,
        ConfigLoader,
        AppConfigurator,
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [SettingsService, PouchdbManager, PouchdbServer],
            useFactory: (settingsService: SettingsService, pouchdbManager: PouchdbManager, pouchdbServer: PouchdbServer) => () =>
                pouchdbServer.setupServer()
                    .then(() => (new SettingsSerializer).load())
                    .then(settings =>
                        settingsService.bootProjectDb(settings).then(() =>
                            settingsService.loadConfiguration(remote.getGlobal('configurationDirPath'))))
                    .then(configuration => {
                        projectConfiguration = configuration;

                        const { createdConstraintIndex, createdFulltextIndex, createdIndexFacade } =
                            IndexerConfiguration.configureIndexers(projectConfiguration);
                        constraintIndex = createdConstraintIndex;
                        fulltextIndex = createdFulltextIndex;
                        return createdIndexFacade;
                     }).then(facade => {
                         indexFacade = facade;
                         return pouchdbManager.reindex(indexFacade);
                    })
        },
        SettingsService,
        { provide: UsernameProvider, useExisting: SettingsService },
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
                return new PouchDbFsImagestore(converter, blobMaker, pouchdbManager.getDbProxy());
            },
            deps: [PouchdbManager, ImageConverter, BlobMaker]
        },
        {
            provide: ProjectCategories,
            useClass: ProjectCategories,
            deps: [ProjectConfiguration]
        },
        {
            provide: DescendantsUtility,
            useClass: DescendantsUtility,
            deps: [ProjectCategories, ProjectConfiguration, DocumentReadDatastore]
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
        PersistenceManager,
        {
            provide: Validator,
            useFactory: (
                documentReadDatastore: DocumentReadDatastore,
                projectConfiguration: ProjectConfiguration,
                projectTypes: ProjectCategories) => {

                return new Validator(
                    projectConfiguration,
                    (q: Query) => documentReadDatastore.find(q),
                    projectTypes
                )
            },
            deps: [DocumentReadDatastore, ProjectConfiguration, ProjectCategories]
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
                datastore: FieldReadDatastore,
                router: Router
            ) => {
                const tabManager = new TabManager(
                    indexFacade, tabSpaceCalculator, stateSerializer, datastore,
                    async (path: string[]) => { await router.navigate(path) });
                router.events.subscribe(async () => { await tabManager.routeChanged(router.url) });
                return tabManager;
            },
            deps: [IndexFacade, TabSpaceCalculator, StateSerializer, FieldReadDatastore, Router]
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

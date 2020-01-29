import {APP_INITIALIZER, LOCALE_ID, NgModule, TRANSLATIONS, TRANSLATIONS_FORMAT} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {DecimalPipe, HashLocationStrategy, LocationStrategy, registerLocaleData} from '@angular/common';
import localeDe from '@angular/common/locales/de';
import {FormsModule} from '@angular/forms';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiMessagesModule, MD, Messages, Query} from 'idai-components-2';
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
import {ImageViewModule} from './image/view/image-view.module';
import {PersistenceManager} from '../core/model/persistence-manager';
import {Validator} from '../core/model/validator';
import {ImportValidator} from '../core/import/import/process/import-validator';
import {MatrixModule} from './matrix/matrix.module';
import {PouchdbManager} from '../core/datastore/core/pouchdb-manager';
import {TaskbarConflictsComponent} from './navbar/taskbar-conflicts.component';
import {TypeUtility} from '../core/model/type-utility';
import {UsernameProvider} from '../core/settings/username-provider';
import {IndexFacade} from '../core/datastore/index/index-facade';
import {FulltextIndex} from '../core/datastore/index/fulltext-index';
import {ConstraintIndex} from '../core/datastore/index/constraint-index';
import {HelpComponent} from './help/help.component';
import {TaskbarUpdateComponent} from './navbar/taskbar-update.component';
import {M} from './m';
import {SettingsSerializer} from '../core/settings/settings-serializer';
import {IndexerConfiguration} from '../indexer-configuration';
import {SynchronizationStatus} from '../core/settings/synchronization-status';
import {Translations} from '../common/translations';
import {ExportModule} from './export/export.module';
import {ProjectsModalComponent} from './navbar/projects-modal.component';
import {FieldDatastore} from '../core/datastore/field/field-datastore';
import {MenuService} from '../desktop/menu-service';
import {UtilTranslations} from '../core/util/util-translations';
import {ProjectConfiguration} from '../core/configuration/project-configuration';
import {ConfigReader} from '../core/configuration/config-reader';
import {ConfigLoader} from '../core/configuration/config-loader';
import {AppConfigurator} from '../core/configuration/app-configurator';
import {StateSerializer} from '../common/state-serializer';
import {FieldReadDatastore} from '../core/datastore/field/field-read-datastore';
import {Router} from '@angular/router';
import {TabManager} from '../core/tabs/tab-manager';
import {TabSpaceCalculator} from '../core/tabs/tab-space-calculator';
import {Imagestore} from '../core/images/imagestore/imagestore';
import {PouchDbFsImagestore} from '../core/images/imagestore/pouch-db-fs-imagestore';
import {ImageConverter} from '../core/images/imagestore/image-converter';
import {BlobMaker} from '../core/images/imagestore/blob-maker';
import {ReadImagestore} from '../core/images/imagestore/read-imagestore';


const remote = require('electron').remote;

let projectConfiguration: ProjectConfiguration|undefined = undefined;
let fulltextIndex: FulltextIndex|undefined = undefined;
let constraintIndex: ConstraintIndex|undefined = undefined;
let indexFacade: IndexFacade|undefined = undefined;


registerLocaleData(localeDe, 'de');


@NgModule({
    imports: [
        ImageViewModule,
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
        MatrixModule
    ],
    declarations: [
        AppComponent,
        NavbarComponent,
        TaskbarComponent,
        TaskbarConflictsComponent,
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
            deps: [SettingsService, PouchdbManager],
            useFactory: (settingsService: SettingsService, pouchdbManager: PouchdbManager) => () =>
                pouchdbManager.setupServer()
                    .then(() => (new SettingsSerializer).load())
                    .then(settings =>
                        settingsService.bootProjectDb(settings).then(() =>
                            settingsService.loadConfiguration(remote.getGlobal('configurationDirPath'))))
                    .then(configuration => {
                        projectConfiguration = configuration;

                        const {createdConstraintIndex, createdFulltextIndex, createdIndexFacade} =
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
        TypeUtility,
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
                fieldDocumentDatastore: FieldDatastore,
                projectConfiguration: ProjectConfiguration,
                typeUtility: TypeUtility) => {

                return new Validator(
                    projectConfiguration,
                    (q: Query) => fieldDocumentDatastore.find(q),
                    typeUtility
                )
            },
            deps: [FieldDatastore, ProjectConfiguration, TypeUtility]
        },
        ImportValidator,
        { provide: MD, useClass: M},
        SynchronizationStatus,
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
    bootstrap: [ AppComponent ]
})
export class AppModule { }
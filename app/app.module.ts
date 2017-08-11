import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {HttpModule} from '@angular/http';
import {FormsModule} from '@angular/forms';
import {Datastore, ReadDatastore} from 'idai-components-2/datastore';
import {IdaiMessagesModule, Messages, MD} from 'idai-components-2/messages';
import {IdaiDocumentsModule, DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Validator, PersistenceManager} from 'idai-components-2/persist';
import {IdaiFieldValidator} from './model/idai-field-validator';
import {ConfigLoader} from 'idai-components-2/configuration';
import {routing} from './app.routing';
import {IdaiFieldDatastore} from './datastore/idai-field-datastore';
import {M} from './m';
import {AppComponent} from './app.component';
import {ResourcesModule} from './resources/resources.module';
import {ImportComponent} from './import/import.component';
import {ExportComponent} from './export/export.component';
import {Importer} from './import/importer';
import {Exporter} from './export/exporter';
import {RelationsCompleter} from './import/relations-completer';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {Imagestore} from './imagestore/imagestore';
import {ReadImagestore} from './imagestore/read-imagestore';
import {ImagesModule} from './images/images.module';
import {NavbarComponent} from './navbar.component';
import {CachedPouchdbDatastore} from './datastore/cached-pouchdb-datastore';
import {BlobMaker} from './imagestore/blob-maker';
import {Converter} from './imagestore/converter';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {SettingsModule} from './settings/settings.module';
import {AppConfigurator} from 'idai-components-2/idai-field-model';
import {SettingsService} from './settings/settings-service';
import {PouchdbServerDatastore} from './datastore/pouchdb-server-datastore';
import {TaskbarComponent} from './taskbar.component';
import {WidgetsModule} from './widgets/widgets.module';
import {ImageTypeUtility} from './util/image-type-utility';
import {ViewUtility} from './util/view-utility';
import {PouchdbManager} from './datastore/pouchdb-manager';
import {PouchDbFsImagestore} from './imagestore/pouch-db-fs-imagestore';
import {SampleDataLoader} from './datastore/sample-data-loader';
import {AutoConflictResolver} from './common/auto-conflict-resolver';
import {ConstraintIndexer} from "./datastore/constraint-indexer";
import {FulltextIndexer} from "./datastore/fulltext-indexer";
import {DocumentCache} from "./datastore/document-cache";

const CONFIG = require('electron').remote.getGlobal('config');


let IMG_PATH;
if (CONFIG['imagestorepath']) {
    IMG_PATH = CONFIG['imagestorepath'];
} else {
    const app = (<any>window).require('electron').remote.app;
    IMG_PATH = app.getPath('appData') + '/' + app.getName() + '/imagestore/';
}

@NgModule({
    imports: [
        ImagesModule,
        ResourcesModule,
        SettingsModule,
        BrowserModule,
        FormsModule,
        HttpModule,
        NgbModule.forRoot(),
        IdaiDocumentsModule,
        IdaiMessagesModule,
        routing,
        IdaiWidgetsModule,
        WidgetsModule
    ],
    declarations: [
        AppComponent,
        NavbarComponent,
        TaskbarComponent,
        ImportComponent,
        ExportComponent
    ],
    providers: [
        { provide: 'app.config', useValue: CONFIG },
        { provide: 'app.imgPath', useValue: IMG_PATH },
        SettingsService,
        {
            provide: ConstraintIndexer,
            useFactory: function() {
                return new ConstraintIndexer([
                    { path: 'resource.relations.isRecordedIn' },
                    { path: 'resource.relations.liesWithin' },
                    { path: 'resource.identifier', string: true }
                ]);
            }
        },
        FulltextIndexer,
        DocumentCache,
        SampleDataLoader,
        { provide: PouchdbManager, useFactory: function(
                sampleDataLoader: SampleDataLoader,
                constraintIndexer: ConstraintIndexer,
                fulltextIndexer: FulltextIndexer,
                documentCache: DocumentCache
            ){
                return new PouchdbManager(
                    sampleDataLoader,
                    constraintIndexer,
                    fulltextIndexer,
                    documentCache);
            },
            deps: [SampleDataLoader, ConstraintIndexer, FulltextIndexer, DocumentCache]
        },
        { provide: Imagestore, useClass: PouchDbFsImagestore },
        { provide: ReadImagestore, useExisting: Imagestore },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        {
            provide: Datastore,
            useFactory: function(pouchdbManager: PouchdbManager,
                                 constraintIndexer: ConstraintIndexer,
                                 fulltextIndexer: FulltextIndexer,
                                 documentCache: DocumentCache): Datastore {
                return new CachedPouchdbDatastore(
                    new PouchdbServerDatastore(pouchdbManager, constraintIndexer, fulltextIndexer),
                    documentCache);
            },
            deps: [PouchdbManager, ConstraintIndexer, FulltextIndexer, DocumentCache]
        },
        { provide: ReadDatastore, useExisting: Datastore },
        { provide: IdaiFieldDatastore, useExisting: Datastore },
        { provide: CachedPouchdbDatastore, useExisting: Datastore },
        Messages,
        BlobMaker,
        Converter,
        ConfigLoader,
        PersistenceManager,
        AppConfigurator,
        DocumentEditChangeMonitor,
        {
            provide: Validator,
            useFactory: function(configLoader: ConfigLoader, datastore: IdaiFieldDatastore) {
                return new IdaiFieldValidator(configLoader, datastore);
            },
            deps: [ConfigLoader, ReadDatastore]
        },
        { provide: MD, useClass: M},
        Importer,
        Exporter,
        RelationsCompleter,
        ImageTypeUtility,
        ViewUtility,
        AutoConflictResolver
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }
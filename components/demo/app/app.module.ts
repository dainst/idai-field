import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {routing} from './app.routing';
import {Datastore} from '../../src/core/datastore/datastore';
import {Messages} from '../../src/core/messages/messages';
import {MemoryDatastore} from './memory-datastore';
import {MD} from '../../src/core/messages/md';
import {M} from './m';
import {DocumentViewDemoComponent} from './document-view-demo.component';
import {MessagesDemoComponent} from './messages-demo.component';
import {MapDemoComponent} from './map-demo.component';
import {AppComponent} from './app.component';
import {IdaiDocumentsModule} from '../../src/core/documents/idai-documents.module';
import {IdaiMessagesModule} from '../../src/core/messages/idai-messages.module';
import {IdaiWidgetsModule} from '../../src/core/widgets/idai-widgets.module';
import {ProjectConfiguration} from '../../src/core/configuration/project-configuration';
import {ConfigLoader} from '../../src/core/configuration/config-loader';
import {ConfigReader} from '../../src/core/configuration/config-reader';
import {IdaiFieldPrePreprocessConfigurationValidator} from '../../src/core/configuration/idai-field-pre-preprocess-configuration-validator';
import {ConfigurationValidator} from '../../src/core/configuration/configuration-validator';
import {IdaiFieldMapModule} from '../../src/field/map/idai-field-map.module';
import {TypeDefinition} from '../../src/core/configuration/type-definition';
import {FieldDefinition} from '../../src/core/configuration/field-definition';

let pconf: any = undefined;

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        IdaiDocumentsModule,
        IdaiMessagesModule,
        IdaiWidgetsModule,
        IdaiFieldMapModule,
        routing
    ],
    declarations: [
        AppComponent,
        DocumentViewDemoComponent,
        MessagesDemoComponent,
        MapDemoComponent
    ],
    providers: [
        ConfigReader,
        ConfigLoader,
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [ConfigLoader],
            useFactory: (configLoader: ConfigLoader) => () => {
                return configLoader.go(
                    'demo/config',
                    { 'Image': { 'fields': { 'dimensions': {} } } as TypeDefinition },
                    [
                        { name: 'depicts', domain: ['Image:inherit'], inverse: 'isDepictedBy', visible: false,
                            editable: false},
                        { name: 'isDepictedBy', range: ['Image:inherit'], inverse: 'depicts', visible: false,
                            editable: false}
                    ],{
                        'identifier': {} as FieldDefinition,
                        'shortDescription': {} as FieldDefinition
                    },
                    ['identifier', 'shortDescription'],
                    new IdaiFieldPrePreprocessConfigurationValidator(),
                    new ConfigurationValidator()
                )
                .then((projectConfiguration: ProjectConfiguration) => pconf = projectConfiguration)
                .catch((msgsWithParams: any) =>{
                    console.error(msgsWithParams);
                });
            }
        },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        { provide: Datastore, useClass: MemoryDatastore },
        { provide: MD, useClass: M },
        {
            provide: Messages,
            useFactory: (md: MD) => {
                return new Messages(md, 3500);
            },
            deps: [MD]
        },
        {
            provide: ProjectConfiguration,
            useFactory: () => {
                if (!pconf) {
                    console.error('pconf has not yet been provided');
                    throw 'pconf has not yet been provided';
                }
                return pconf;
            },
            deps: []
        }
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule {}

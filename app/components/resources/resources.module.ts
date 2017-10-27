import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {ResourcesComponent} from './resources.component';
import {GeometryViewComponent} from './map/docview/geometry-view.component';
import {EditableMapComponent} from './map/map/editable-map.component';
import {ResourcesMapComponent} from './map/resources-map.component';
import {ListComponent} from './list/list.component';
import {RowComponent} from './list/row.component';
import {PlusButtonComponent} from './plus-button.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {DoceditModule} from '../docedit/docedit.module';
import {ResourcesState} from './view/resources-state';
import {ThumbnailViewComponent} from './map/docview/thumbnail-view.component';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {DocumentViewSidebarComponent} from './map/docview/document-view-sidebar.component';
import {RoutingService} from '../routing-service';
import {DoceditProxy} from './service/docedit-proxy';
import {ViewFacade} from './view/view-facade';
import {CachedDatastore} from '../../core/datastore/cached-datastore';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {SettingsService} from '../../core/settings/settings-service';
import {StateSerializer} from '../../common/state-serializer';
import {Datastore} from 'idai-components-2/datastore';
import {SidebarListComponent} from './map/sidebar-list.component';
import {IdaiFieldDatastore} from '../../core/datastore/idai-field-datastore';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        IdaiDocumentsModule,
        WidgetsModule,
        ImageGridModule,
        IdaiWidgetsModule,
        DoceditModule
    ],
    declarations: [
        ResourcesComponent,
        GeometryViewComponent,
        EditableMapComponent,
        ResourcesMapComponent,
        ListComponent,
        RowComponent,
        PlusButtonComponent,
        ThumbnailViewComponent,
        DocumentViewSidebarComponent,
        SidebarListComponent
    ],
    providers: [
        ResourcesState,
        RoutingService,
        DoceditProxy,
        {
            provide: ViewFacade,
            useFactory: function(
                projectConfiguration: ProjectConfiguration,
                datastore: IdaiFieldDatastore,
                settingsService: SettingsService,
                stateSerializer: StateSerializer
            ) {

                const views = projectConfiguration.getViewsList();
                for (let view of views) {
                    (view as any)['mainTypeLabel'] = // TODO do this with a new idai-field-configuration-preprocessor that extends configuration-preprocessor
                        projectConfiguration.getLabelForType(view.operationSubtype) as any;
                }

                return new ViewFacade(
                    datastore,
                    settingsService,
                    stateSerializer,
                    views
                );
            },
            deps: [ProjectConfiguration, Datastore, SettingsService, StateSerializer]
        },
    ],
    exports: [
        GeometryViewComponent
    ]
})

export class ResourcesModule {}
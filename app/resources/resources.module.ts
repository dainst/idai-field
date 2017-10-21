import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {ResourcesComponent} from './resources.component';
import {GeometryViewComponent} from './docview/geometry-view.component';
import {EditableMapComponent} from './map/editable-map.component';
import {MapWrapperComponent} from './map-wrapper.component';
import {ListComponent} from './list/list.component';
import {RowComponent} from './list/row.component';
import {PlusButtonComponent} from './plus-button.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {DoceditModule} from '../docedit/docedit.module';
import {ResourcesState} from './view/resources-state';
import {ThumbnailViewComponent} from './docview/thumbnail-view.component';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {DocumentViewWrapperComponent} from './docview/document-view-wrapper.component';
import {RoutingHelper} from './service/routing-helper';
import {DoceditProxy} from './service/docedit-proxy';
import {ViewFacade} from './view/view-facade';
import {Views} from './view/views';
import {IdaiFieldDatastore} from '../model/idai-field-datastore';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {SettingsService} from '../settings/settings-service';
import {Loading} from '../widgets/loading';
import {StateSerializer} from '../common/state-serializer';
import {Datastore} from 'idai-components-2/datastore';
import {SidebarListComponent} from './sidebar-list.component';

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
        MapWrapperComponent,
        ListComponent,
        RowComponent,
        PlusButtonComponent,
        ThumbnailViewComponent,
        DocumentViewWrapperComponent,
        SidebarListComponent
    ],
    providers: [
        ResourcesState,
        RoutingHelper,
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
                    view['mainTypeLabel'] =
                        projectConfiguration.getLabelForType(view.mainType);
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
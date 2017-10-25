import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {ResourcesComponent} from './resources.component';
import {GeometryViewComponent} from './map/docview/geometry-view.component';
import {EditableMapComponent} from './map/map/editable-map.component';
import {MapWrapperComponent} from './map/resources-map.component';
import {ListComponent} from './list/list.component';
import {RowComponent} from './list/row.component';
import {PlusButtonComponent} from './plus-button.component';
import {WidgetsModule} from '../widgets/widgets.module';
import {DoceditModule} from '../docedit/docedit.module';
import {ResourcesState} from './view/resources-state';
import {ThumbnailViewComponent} from './map/docview/thumbnail-view.component';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {DocumentViewSidebarComponent} from './map/docview/document-view-sidebar.component';
import {RoutingHelper} from './service/routing-helper';
import {DoceditProxy} from './service/docedit-proxy';
import {ViewFacade} from './view/view-facade';
import {IdaiFieldDatastore} from '../model/idai-field-datastore';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {SettingsService} from '../settings/settings-service';
import {StateSerializer} from '../common/state-serializer';
import {Datastore} from 'idai-components-2/datastore';
import {SidebarListComponent} from './map/sidebar-list.component';

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
        DocumentViewSidebarComponent,
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
                // views.unshift({
                //     label: "Übersicht",
                //     operationSubtype: "Project",
                //     name: "project"
                // });
                for (let view of views) {
                    view['mainTypeLabel'] =
                        projectConfiguration.getLabelForType(view.operationSubtype); // TODO do this with preprocessor
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
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2';
import {IdaiWidgetsModule} from 'idai-components-2';
import {ProjectConfiguration} from 'idai-components-2';
import {ResourcesComponent} from './resources.component';
import {GeometryViewComponent} from './map/detail/geometry-view.component';
import {EditableMapComponent} from './map/map/editable-map.component';
import {ResourcesMapComponent} from './map/resources-map.component';
import {ListComponent} from './list/list.component';
import {RowComponent} from './list/row.component';
import {PlusButtonComponent} from './plus-button.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {DoceditModule} from '../docedit/docedit.module';
import {ThumbnailViewComponent} from './map/detail/thumbnail-view.component';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {DocumentViewSidebarComponent} from './map/detail/document-detail-sidebar.component';
import {RoutingService} from '../routing-service';
import {DoceditLauncher} from './service/docedit-launcher';
import {ViewFacade} from './view/view-facade';
import {SettingsService} from '../../core/settings/settings-service';
import {SidebarListComponent} from './map/list/sidebar-list.component';
import {IdaiFieldDocumentDatastore} from '../../core/datastore/field/idai-field-document-datastore';
import {LayerManager} from './map/map/layer-manager';
import {LayerImageProvider} from './map/map/layer-image-provider';
import {LayerMenuComponent} from './map/map/layer-menu.component';
import {RemoteChangesStream} from '../../core/datastore/core/remote-changes-stream';
import {NavigationComponent} from './navigation/navigation.component';
import {NavigationService} from './navigation/navigation-service';
import {ResourcesSearchBarComponent} from './searchbar/resources-search-bar.component';
import {SearchSuggestionsComponent} from './searchbar/search-suggestions.component';
import {StandardStateSerializer} from '../../common/standard-state-serializer';
import {StateSerializer} from '../../common/state-serializer';
import {Loading} from '../../widgets/loading';
import {ResourcesStateManager} from './view/resources-state-manager';
import {ViewDefinition} from './view/state/view-definition';
import {OperationViews} from './view/state/operation-views';
import {IdaiFieldDocumentReadDatastore} from '../../core/datastore/field/idai-field-document-read-datastore';
import {SearchConstraintsComponent} from './searchbar/search-constraints.component';

const remote = require('electron').remote;

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
        LayerMenuComponent,
        ListComponent,
        RowComponent,
        PlusButtonComponent,
        ThumbnailViewComponent,
        DocumentViewSidebarComponent,
        SidebarListComponent,
        NavigationComponent,
        ResourcesSearchBarComponent,
        SearchSuggestionsComponent,
        SearchConstraintsComponent
    ],
    providers: [
        { provide: StateSerializer, useClass: StandardStateSerializer },
        NavigationService,
        ResourcesStateManager,
        RoutingService,
        DoceditLauncher,
        LayerManager,
        LayerImageProvider,
        {
            provide: ResourcesStateManager,
            useFactory: (datastore: IdaiFieldDocumentReadDatastore,
                         stateSerializer: StateSerializer,
                         projectConfiguration: ProjectConfiguration,
                         settingsService: SettingsService) => {

                const views: ViewDefinition[] = [
                    {
                        "label": "Ausgrabung",
                        "name": "excavation",
                        "operationSubtype": "Trench"
                    },
                    {
                        "label": "Bauaufnahme",
                        "name": "Building",
                        "operationSubtype": "Building"
                    },
                    {
                        "label": "Survey",
                        "name": "survey",
                        "operationSubtype": "Survey"
                    }
                ];
                for (let view of views) {
                    (view as any)['mainTypeLabel'] = projectConfiguration.getLabelForType(view.operationSubtype) as any;
                }

                const projectName = settingsService.getSelectedProject();
                if (!projectName) throw 'project not set';

                return new ResourcesStateManager(
                    datastore,
                    stateSerializer,
                    new OperationViews(views),
                    ['Place'],
                    projectName,
                    remote.getGlobal('switches').suppress_map_load_for_test
                );
            },
            deps: [IdaiFieldDocumentReadDatastore, StateSerializer, ProjectConfiguration, SettingsService]
        },
        {
            provide: ViewFacade,
            useFactory: function(
                projectConfiguration: ProjectConfiguration,
                datastore: IdaiFieldDocumentDatastore,
                changesStream: RemoteChangesStream,
                resourcesStateManager: ResourcesStateManager,
                loading: Loading
            ) {

                return new ViewFacade(
                    projectConfiguration,
                    datastore,
                    changesStream,
                    resourcesStateManager,
                    loading
                );
            },
            deps: [
                ProjectConfiguration,
                IdaiFieldDocumentDatastore,
                RemoteChangesStream,
                ResourcesStateManager,
                Loading
            ]
        },
    ],
    exports: [
        GeometryViewComponent
    ]
})

export class ResourcesModule {}
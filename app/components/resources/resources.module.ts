import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/core';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {ResourcesComponent} from './resources.component';
import {GeometryViewComponent} from './map/detail/geometry-view.component';
import {EditableMapComponent} from './map/map/editable-map.component';
import {ResourcesMapComponent} from './map/resources-map.component';
import {ListComponent} from './list/list.component';
import {RowComponent} from './list/row.component';
import {PlusButtonComponent} from './plus-button.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {DoceditModule} from '../docedit/docedit.module';
import {ResourcesState} from './state/resources-state';
import {ThumbnailViewComponent} from './map/detail/thumbnail-view.component';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {DocumentViewSidebarComponent} from './map/detail/document-detail-sidebar.component';
import {RoutingService} from '../routing-service';
import {DoceditLauncher} from './service/docedit-launcher';
import {ViewFacade} from './state/view-facade';
import {ProjectConfiguration} from 'idai-components-2/core';
import {SettingsService} from '../../core/settings/settings-service';
import {ListSidebarComponent} from './map/list/list-sidebar.component';
import {IdaiFieldDocumentDatastore} from '../../core/datastore/idai-field-document-datastore';
import {LayerManager} from './map/map/layer-manager';
import {LayerImageProvider} from './map/map/layer-image-provider';
import {LayerMenuComponent} from './map/map/layer-menu.component';
import {RemoteChangesStream} from '../../core/datastore/core/remote-changes-stream';
import {NavigationComponent} from './navigation/navigation.component';
import {NavigationService} from './navigation/navigation-service';
import {OperationViews} from './state/operation-views';
import {ResourcesSearchBarComponent} from './searchbar/resources-search-bar.component';
import {SearchSuggestionsComponent} from './searchbar/search-suggestions.component';
import {StandardStateSerializer} from "../../common/standard-state-serializer";
import {StateSerializer} from "../../common/state-serializer";
import {ViewDefinition} from './state/view-definition';

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
        ListSidebarComponent,
        NavigationComponent,
        ResourcesSearchBarComponent,
        SearchSuggestionsComponent
    ],
    providers: [
        { provide: StateSerializer, useClass: StandardStateSerializer },
        NavigationService,
        ResourcesState,
        RoutingService,
        DoceditLauncher,
        LayerManager,
        LayerImageProvider,
        {
            provide: ResourcesState,
            useFactory: (stateSerializer: StateSerializer,
                         projectConfiguration: ProjectConfiguration,
                         settingsService: SettingsService) => {

                const views: ViewDefinition[] = [
                    {
                        "label": "Ausgrabung",
                        "mainType": "Trench",
                        "name": "excavation",
                        "operationSubtype": "Trench"
                    },
                    {
                        "label": "Bauaufnahme",
                        "mainType": "Building",
                        "name": "Building",
                        "operationSubtype": "Building"
                    },
                    {
                        "label": "Survey",
                        "mainType": "Survey",
                        "name": "survey",
                        "operationSubtype": "Survey"
                    }
                ];
                for (let view of views) {
                    (view as any)['mainTypeLabel'] = projectConfiguration.getLabelForType(view.operationSubtype) as any;
                }

                const project = settingsService.getSelectedProject();
                if (!project) throw 'project not set';

                return new ResourcesState(
                    stateSerializer,
                    new OperationViews(views),
                    project,
                    remote.getGlobal('switches').suppress_map_load_for_test
                );
            },
            deps: [StateSerializer, ProjectConfiguration, SettingsService]
        },
        {
            provide: ViewFacade,
            useFactory: function(
                projectConfiguration: ProjectConfiguration,
                datastore: IdaiFieldDocumentDatastore,
                changesStream: RemoteChangesStream,
                settingsService: SettingsService,
                resourcesState: ResourcesState
            ) {

                return new ViewFacade(
                    datastore,
                    changesStream,
                    settingsService,
                    resourcesState
                );
            },
            deps: [
                ProjectConfiguration,
                IdaiFieldDocumentDatastore,
                RemoteChangesStream,
                SettingsService,
                ResourcesState]
        },
    ],
    exports: [
        GeometryViewComponent
    ]
})

export class ResourcesModule {}
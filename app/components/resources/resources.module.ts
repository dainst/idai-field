import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule, IdaiWidgetsModule, ProjectConfiguration} from 'idai-components-2';
import {ResourcesComponent} from './resources.component';
import {GeometryViewComponent} from './map/list/geometry-view.component';
import {EditableMapComponent} from './map/map/editable-map.component';
import {ResourcesMapComponent} from './map/resources-map.component';
import {ListComponent} from './list/list.component';
import {RowComponent} from './list/row.component';
import {PlusButtonComponent} from './plus-button.component';
import {WidgetsModule} from '../../widgets/widgets.module';
import {DoceditModule} from '../docedit/docedit.module';
import {ThumbnailViewComponent} from './map/list/thumbnail-view.component';
import {ImageGridModule} from '../imagegrid/image-grid.module';
import {RoutingService} from '../routing-service';
import {DoceditLauncher} from './service/docedit-launcher';
import {ViewFacade} from './view/view-facade';
import {SettingsService} from '../../core/settings/settings-service';
import {SidebarListComponent} from './map/list/sidebar-list.component';
import {FieldDatastore} from '../../core/datastore/field/field-datastore';
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
import {FieldReadDatastore} from '../../core/datastore/field/field-read-datastore';
import {LayerMapComponent} from './map/map/layer-map.component';
import {ResourcesSearchConstraintsComponent} from './searchbar/resources-search-constraints.component';
import {IndexFacade} from '../../core/datastore/index/index-facade';
import {MoveModalComponent} from './move-modal.component';
import {TypeUtility} from '../../core/model/type-utility';
import {ContextMenuComponent} from './map/context-menu.component';
import {ResourceDeletion} from './deletion/resource-deletion';
import {DeletionInProgressModalComponent} from './deletion/deletion-in-progress-modal.component';
import {TabManager} from '../tab-manager';
import {SidebarListButtonGroupComponent} from './map/list/sidebar-list-button-group.component';
import {RelationsViewComponent} from './map/list/relations-view.component';
import {ThumbnailComponent} from './map/list/thumbnail.component';

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
        LayerMapComponent,
        EditableMapComponent,
        ResourcesMapComponent,
        LayerMenuComponent,
        ListComponent,
        RowComponent,
        PlusButtonComponent,
        ThumbnailViewComponent,
        SidebarListComponent,
        SidebarListButtonGroupComponent,
        RelationsViewComponent,
        NavigationComponent,
        ResourcesSearchBarComponent,
        ResourcesSearchConstraintsComponent,
        SearchSuggestionsComponent,
        ContextMenuComponent,
        MoveModalComponent,
        DeletionInProgressModalComponent,
        ThumbnailComponent
    ],
    providers: [
        { provide: StateSerializer, useClass: StandardStateSerializer },
        NavigationService,
        RoutingService,
        DoceditLauncher,
        LayerManager,
        LayerImageProvider,
        ResourceDeletion,
        {
            provide: ResourcesStateManager,
            useFactory: (datastore: FieldReadDatastore,
                         indexFacade: IndexFacade,
                         stateSerializer: StateSerializer,
                         projectConfiguration: ProjectConfiguration,
                         settingsService: SettingsService,
                         typeUtility: TypeUtility,
                         tabManager: TabManager) => {

                const projectName = settingsService.getSelectedProject();
                if (!projectName) throw 'project not set';

                return new ResourcesStateManager(
                    datastore,
                    indexFacade,
                    stateSerializer,
                    typeUtility,
                    tabManager,
                    projectName,
                    remote.getGlobal('switches').suppress_map_load_for_test
                );
            },
            deps: [
                FieldReadDatastore, IndexFacade, StateSerializer, ProjectConfiguration, SettingsService,
                TypeUtility, TabManager
            ]
        },
        {
            provide: ViewFacade,
            useFactory: function(
                projectConfiguration: ProjectConfiguration,
                datastore: FieldDatastore,
                changesStream: RemoteChangesStream,
                resourcesStateManager: ResourcesStateManager,
                loading: Loading,
                indexFacade: IndexFacade
            ) {
                return new ViewFacade(
                    projectConfiguration,
                    datastore,
                    changesStream,
                    resourcesStateManager,
                    loading,
                    indexFacade
                );
            },
            deps: [
                ProjectConfiguration,
                FieldDatastore,
                RemoteChangesStream,
                ResourcesStateManager,
                Loading,
                IndexFacade
            ]
        },
    ],
    exports: [
        GeometryViewComponent
    ],
    entryComponents: [
        MoveModalComponent,
        DeletionInProgressModalComponent
    ]
})

export class ResourcesModule {}
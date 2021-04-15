import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ChangesStream, Datastore, IndexFacade, SyncService } from 'idai-field-core';
import { StandardStateSerializer } from '../../core/common/standard-state-serializer';
import { StateSerializer } from '../../core/common/state-serializer';
import { ProjectConfiguration } from '../../core/configuration/project-configuration';
import { NavigationService } from '../../core/resources/navigation/navigation-service';
import { ResourcesStateManager } from '../../core/resources/view/resources-state-manager';
import { ViewFacade } from '../../core/resources/view/view-facade';
import { SettingsProvider } from '../../core/settings/settings-provider';
import { TabManager } from '../../core/tabs/tab-manager';
import { DoceditModule } from '../docedit/docedit.module';
import { ImageGridModule } from '../image/grid/image-grid.module';
import { ImageViewerModule } from '../image/viewer/image-viewer.module';
import { Messages } from '../messages/messages';
import { RoutingService } from '../routing-service';
import { Loading } from '../widgets/loading';
import { WidgetsModule } from '../widgets/widgets.module';
import { BaseList } from './base-list';
import { DeletionInProgressModalComponent } from './deletion/deletion-in-progress-modal.component';
import { ResourceDeletion } from './deletion/resource-deletion';
import { ListComponent } from './list/list.component';
import { RowComponent } from './list/row.component';
import { GeometryViewComponent } from './map/list/geometry-view.component';
import { SidebarListComponent } from './map/list/sidebar-list.component';
import { EditableMapComponent } from './map/map/editable-map.component';
import { LayerMapComponent } from './map/map/layer-map.component';
import { LayerImageProvider } from './map/map/layers/layer-image-provider';
import { LayerManager } from './map/map/layers/layer-manager';
import { LayerMenuComponent } from './map/map/layers/layer-menu.component';
import { MapComponent } from './map/map/map.component';
import { ResourcesMapComponent } from './map/resources-map.component';
import { MoveModalComponent } from './move-modal.component';
import { NavigationComponent } from './navigation/navigation.component';
import { PlusButtonComponent } from './plus-button.component';
import { ResourcesComponent } from './resources.component';
import { ResourcesSearchBarComponent } from './searchbar/resources-search-bar.component';
import { ResourcesSearchConstraintsComponent } from './searchbar/resources-search-constraints.component';
import { SearchSuggestionsComponent } from './searchbar/search-suggestions.component';
import { DoceditLauncher } from './service/docedit-launcher';
import { ViewModalLauncher } from './service/view-modal-launcher';
import { TypeGridElementComponent } from './types/type-grid-element.component';
import { TypeGridComponent } from './types/type-grid.component';
import { TypeIconComponent } from './types/type-icon.component';
import { TypesComponent } from './types/types.component';
import { ContextMenuComponent } from './widgets/context-menu.component';
import { ListButtonGroupComponent } from './widgets/list-button-group.component';
import { ChildrenViewComponent } from './widgets/popovermenu/children-view.component';
import { PopoverMenuComponent } from './widgets/popovermenu/popover-menu.component';


const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        WidgetsModule,
        ImageGridModule,
        DoceditModule,
        ImageViewerModule,
        ScrollingModule,
        DragDropModule
    ],
    declarations: [
        ResourcesComponent,
        GeometryViewComponent,
        MapComponent,
        LayerMapComponent,
        EditableMapComponent,
        ResourcesMapComponent,
        TypesComponent,
        TypeGridComponent,
        TypeGridElementComponent,
        TypeIconComponent,
        LayerMenuComponent,
        ListComponent,
        RowComponent,
        PlusButtonComponent,
        SidebarListComponent,
        ListButtonGroupComponent,
        PopoverMenuComponent,
        NavigationComponent,
        ResourcesSearchBarComponent,
        ResourcesSearchConstraintsComponent,
        SearchSuggestionsComponent,
        ContextMenuComponent,
        MoveModalComponent,
        DeletionInProgressModalComponent,
        ChildrenViewComponent,
        BaseList
    ],
    providers: [
        { provide: StateSerializer, useClass: StandardStateSerializer },
        RoutingService,
        DoceditLauncher,
        ViewModalLauncher,
        LayerManager,
        LayerImageProvider,
        ResourceDeletion,
        {
            provide: NavigationService,
            useFactory: (projectConfiguration: ProjectConfiguration,
                         routingService: RoutingService,
                         viewFacade: ViewFacade) => {

                return new NavigationService(projectConfiguration, routingService, viewFacade);
            },
            deps: [ProjectConfiguration, RoutingService, ViewFacade]
        },
        {
            provide: ResourcesStateManager,
            useFactory: (datastore: Datastore,
                         indexFacade: IndexFacade,
                         stateSerializer: StateSerializer,
                         projectConfiguration: ProjectConfiguration,
                         settingsProvider: SettingsProvider,
                         tabManager: TabManager) => {

                const projectName = settingsProvider.getSettings().selectedProject;
                if (!projectName) throw 'project not set';

                return new ResourcesStateManager(
                    datastore,
                    indexFacade,
                    stateSerializer,
                    tabManager,
                    projectName,
                    projectConfiguration,
                    remote.getGlobal('switches').suppress_map_load_for_test
                );
            },
            deps: [
                Datastore, IndexFacade, StateSerializer, ProjectConfiguration, SettingsProvider,
                TabManager
            ]
        },
        {
            provide: ViewFacade,
            useFactory: function(
                datastore: Datastore,
                changesStream: ChangesStream,
                resourcesStateManager: ResourcesStateManager,
                loading: Loading,
                indexFacade: IndexFacade,
                messages: Messages,
                syncService: SyncService
            ) {
                return new ViewFacade(
                    datastore,
                    changesStream,
                    resourcesStateManager,
                    loading,
                    indexFacade,
                    messages,
                    syncService
                );
            },
            deps: [
                Datastore,
                ChangesStream,
                ResourcesStateManager,
                Loading,
                IndexFacade,
                Messages,
                SyncService
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

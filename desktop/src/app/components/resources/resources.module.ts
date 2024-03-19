import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ChangesStream, Datastore, IndexFacade, SyncService } from 'idai-field-core';
import { ProjectConfiguration } from 'idai-field-core';
import { NavigationService } from './navigation/navigation-service';
import { ResourcesStateManager } from '../../components/resources/view/resources-state-manager';
import { ViewFacade } from '../../components/resources/view/view-facade';
import { TabManager } from '../../services/tabs/tab-manager';
import { DoceditModule } from '../docedit/docedit.module';
import { ImageGridModule } from '../image/grid/image-grid.module';
import { ImageViewerModule } from '../image/viewer/image-viewer.module';
import { Messages } from '../messages/messages';
import { Loading } from '../widgets/loading';
import { WidgetsModule } from '../widgets/widgets.module';
import { BaseList } from './base-list';
import { ResourceDeletion } from './actions/delete/resource-deletion';
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
import { MoveModalComponent } from './actions/move/move-modal.component';
import { NavigationComponent } from './navigation/navigation.component';
import { PlusButtonComponent } from './plus-button.component';
import { ResourcesComponent } from './resources.component';
import { ResourcesSearchBarComponent } from './searchbar/resources-search-bar.component';
import { ResourcesSearchConstraintsComponent } from './searchbar/resources-search-constraints.component';
import { SearchSuggestionsComponent } from './searchbar/search-suggestions.component';
import { DoceditLauncher } from './service/docedit-launcher';
import { GridItemComponent } from './grid-list/grid-item.component';
import { GridComponent } from './grid-list/grid.component';
import { GridItemIconComponent } from './grid-list/grid-item-icon.component';
import { GridListComponent } from './grid-list/grid-list.component';
import { ResourcesContextMenuComponent } from './widgets/resources-context-menu.component';
import { ListButtonGroupComponent } from './widgets/list-button-group.component';
import { PopoverMenuComponent } from './widgets/popover-menu.component';
import { Routing } from '../../services/routing';
import { StandardStateSerializer } from '../../services/standard-state-serializer';
import { StateSerializer } from '../../services/state-serializer';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { QrCodeEditorModalComponent } from './actions/edit-qr-code/qr-code-editor-modal.component';
import { DeleteQrCodeModalComponent } from './actions/edit-qr-code/delete-qr-code-modal.component';
import { QrCodeService } from './service/qr-code-service';
import { StoragePlaceScanner } from './actions/scan-storage-place/storage-place-scanner';
import { ScanStoragePlaceModalComponent } from './actions/scan-storage-place/scan-storage-place-modal.component';
import { PrintSettingsModalComponent } from './actions/edit-qr-code/print-settings/print-settings-modal.component';
import { CreatePrintSettingsProfileModalComponent } from './actions/edit-qr-code/print-settings/create-print-settings-profile-modal.component';

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
        GridListComponent,
        GridComponent,
        GridItemComponent,
        GridItemIconComponent,
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
        ResourcesContextMenuComponent,
        MoveModalComponent,
        BaseList,
        QrCodeEditorModalComponent,
        PrintSettingsModalComponent,
        CreatePrintSettingsProfileModalComponent,
        DeleteQrCodeModalComponent,
        ScanStoragePlaceModalComponent,
    ],
    providers: [
        { provide: StateSerializer, useClass: StandardStateSerializer },
        Routing,
        DoceditLauncher,
        LayerManager,
        LayerImageProvider,
        ResourceDeletion,
        QrCodeService,
        StoragePlaceScanner,
        {
            provide: NavigationService,
            useFactory: (projectConfiguration: ProjectConfiguration,
                         routingService: Routing,
                         viewFacade: ViewFacade,
                         messages: Messages) => {

                return new NavigationService(projectConfiguration, routingService, viewFacade, messages);
            },
            deps: [ProjectConfiguration, Routing, ViewFacade, Messages]
        },
        {
            provide: ResourcesStateManager,
            useFactory: (datastore: Datastore,
                         indexFacade: IndexFacade,
                         stateSerializer: StateSerializer,
                         projectConfiguration: ProjectConfiguration,
                         settingsProvider: SettingsProvider,
                         tabManager: TabManager) => {

                const projectIdentifier: string = settingsProvider.getSettings().selectedProject;
                if (!projectIdentifier) throw 'project not set';

                return new ResourcesStateManager(
                    datastore,
                    indexFacade,
                    stateSerializer,
                    tabManager,
                    projectIdentifier,
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
        MoveModalComponent
    ]
})

export class ResourcesModule {}

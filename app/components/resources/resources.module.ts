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
import {DoceditLauncher} from './service/docedit-launcher';
import {ViewFacade} from './view/view-facade';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {SettingsService} from '../../core/settings/settings-service';
import {SidebarListComponent} from './map/sidebar-list.component';
import {IdaiFieldDocumentDatastore} from '../../core/datastore/idai-field-document-datastore';
import {LayerImageProvider} from './map/map/layer-image-provider';
import {ChangesStream} from '../../core/datastore/core/changes-stream';
import {FoldState} from './list/fold-state';
import {ImageLayerManager} from './map/map/image-layer-manager';
import {ImageLayerMenuComponent} from './map/map/image-layer-menu.component';
import {Map3DComponent} from './map/map-3d/map-3d.component';
import {PointGeometriesComponent} from './map/map-3d/geometries/point-geometries/point-geometries.component';
import {MeshGeometriesComponent} from './map/map-3d/geometries/mesh-geometries/mesh-geometries.component';
import {Layer3DMenuComponent} from './map/map-3d/layers/layers-3d/layer-3d-menu.component';
import {Layer3DManager} from './map/map-3d/layers/layers-3d/layer-3d-manager';
import {Layers3DComponent} from './map/map-3d/layers/layers-3d/layers-3d.component';
import {Core3DModule} from '../core-3d/core-3d.module';
import {ControlButtonsComponent} from './map/map-3d/control-buttons.component';
import {Layer3DMeshManager} from './map/map-3d/layers/layers-3d/layer-3d-mesh-manager';
import {Layers2DComponent} from './map/map-3d/layers/layers-2d/layers-2d.component';
import {Layer2DMeshManager} from './map/map-3d/layers/layers-2d/layer-2d-mesh-manager';
import {Layer2DMeshBuilder} from './map/map-3d/layers/layers-2d/layer-2d-mesh-builder';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        IdaiDocumentsModule,
        WidgetsModule,
        ImageGridModule,
        IdaiWidgetsModule,
        DoceditModule,
        Core3DModule
    ],
    declarations: [
        ResourcesComponent,
        GeometryViewComponent,
        EditableMapComponent,
        ResourcesMapComponent,
        ImageLayerMenuComponent,
        ListComponent,
        RowComponent,
        PlusButtonComponent,
        ThumbnailViewComponent,
        DocumentViewSidebarComponent,
        SidebarListComponent,
        Map3DComponent,
        Layers2DComponent,
        Layers3DComponent,
        Layer3DMenuComponent,
        PointGeometriesComponent,
        MeshGeometriesComponent,
        ControlButtonsComponent
    ],
    providers: [
        FoldState,
        ResourcesState,
        RoutingService,
        DoceditLauncher,
        ImageLayerManager,
        Layer3DManager,
        Layer2DMeshManager,
        Layer3DMeshManager,
        LayerImageProvider,
        Layer2DMeshBuilder,
        {
            provide: ViewFacade,
            useFactory: function(
                projectConfiguration: ProjectConfiguration,
                datastore: IdaiFieldDocumentDatastore,
                changesStream: ChangesStream,
                settingsService: SettingsService,
                resourcesState: ResourcesState
            ) {

                const views = projectConfiguration.getViewsList();
                for (let view of views) {
                    (view as any)['mainTypeLabel'] = // TODO do this with a new idai-field-configuration-preprocessor that extends configuration-preprocessor
                        projectConfiguration.getLabelForType(view.operationSubtype) as any;
                }

                return new ViewFacade(
                    datastore,
                    changesStream,
                    settingsService,
                    resourcesState,
                    views
                );
            },
            deps: [
                ProjectConfiguration,
                IdaiFieldDocumentDatastore,
                ChangesStream,
                SettingsService,
                ResourcesState]
        }
    ],
    exports: [
        GeometryViewComponent
    ]
})

export class ResourcesModule {}
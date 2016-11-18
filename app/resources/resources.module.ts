import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {resourcesRouting} from './resources.routing';
import {ResourcesComponent} from './resources.component';
import {GeometryViewComponent} from './geometry-view.component';
import {ThumbnailViewComponent} from './thumbnail-view.component';
import {ResourceEditNavigationComponent} from './resource-edit-navigation.component';
import {MapWrapperComponent} from './map-wrapper.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MapComponent} from './map/map.component';
import {PlusButtonComponent} from './plus-button.component';
import {MapState} from './map/map-state';
import {WidgetsModule} from '../widgets/widgets.module'
import {IdaiDocumentsModule} from 'idai-components-2/documents';

@NgModule({
    imports: [
        resourcesRouting,
        BrowserModule,
        NgbModule,
        IdaiDocumentsModule,
        WidgetsModule
    ],
    declarations: [
        ResourcesComponent,
        GeometryViewComponent,
        ResourceEditNavigationComponent,
        MapWrapperComponent,
        MapComponent,
        PlusButtonComponent,
        ThumbnailViewComponent
    ],
    providers: [
        MapState
    ]
})

export class ResourcesModule {}
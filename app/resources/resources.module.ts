import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ResourcesComponent} from './resources.component';
import {GeometryViewComponent} from './geometry-view.component';
import {MapWrapperComponent} from './map-wrapper.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {EditableMapComponent} from './map/editable-map.component';
import {PlusButtonComponent} from './plus-button.component';
import {LayerMapState} from './map/layer-map-state';
import {WidgetsModule} from '../widgets/widgets.module'
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets'

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        IdaiDocumentsModule,
        WidgetsModule,
        IdaiWidgetsModule
    ],
    declarations: [
        ResourcesComponent,
        GeometryViewComponent,
        MapWrapperComponent,
        EditableMapComponent,
        PlusButtonComponent
    ],
    providers: [
        LayerMapState
    ],
    exports: [
        GeometryViewComponent
    ]
})

export class ResourcesModule {}
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule} from 'idai-components-2/documents';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {WidgetsModule} from '../../widgets/widgets.module';
import {view3DRouting} from './view-3d.routing';
import {View3DComponent} from './view-3d.component';
import {Object3DViewerComponent} from './object-3d-viewer.component';
import {Core3DModule} from '../core-3d/core-3d.module';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        WidgetsModule,
        IdaiDocumentsModule,
        IdaiWidgetsModule,
        Core3DModule,
        view3DRouting
    ],
    declarations: [
        View3DComponent,
        Object3DViewerComponent
    ]
})

export class View3DModule {}
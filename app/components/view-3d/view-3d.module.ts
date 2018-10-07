import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {IdaiDocumentsModule, IdaiWidgetsModule} from 'idai-components-2';
import {WidgetsModule} from '../../widgets/widgets.module';
import {view3DRouting} from './view-3d.routing';
import {View3DComponent} from './view-3d.component';
import {Model3DViewerModule} from '../model-3d-viewer/model-3d-viewer.module';
import {Core3DModule} from '../core-3d/core-3d.module';


@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        WidgetsModule,
        IdaiDocumentsModule,
        IdaiWidgetsModule,
        Model3DViewerModule,
        Core3DModule,
        view3DRouting
    ],
    declarations: [
        View3DComponent
    ]
})

export class View3DModule {}
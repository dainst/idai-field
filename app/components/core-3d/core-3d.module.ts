import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MeshLoadingProgressBarComponent} from './mesh-loading/mesh-loading-progress-bar.component';
import {MeshLoadingProgress} from './mesh-loading/mesh-loading-progress';
import {ZoomButtonsComponent} from './zoom-buttons/zoom-buttons.component';
import {MeshPreparationUtility} from './mesh-loading/mesh-preparation-utility';
import {MeshLoader} from './mesh-loading/mesh-loader';
import {Model3DStore} from './model-3d-store';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule
    ],
    declarations: [
        MeshLoadingProgressBarComponent,
        ZoomButtonsComponent
    ],
    providers: [
        MeshLoadingProgress,
        Model3DStore,
        MeshLoader,
        MeshPreparationUtility
    ],
    exports: [
        MeshLoadingProgressBarComponent,
        ZoomButtonsComponent
    ]
})

export class Core3DModule {}
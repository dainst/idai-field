import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MeshLoadingProgressBarComponent} from './mesh-loading-progress-bar.component';
import {MeshLoadingProgress} from './mesh-loading-progress';
import {ZoomButtonsComponent} from './zoom-buttons.component';
import {MeshPreparationUtility} from './mesh-preparation-utility';
import {MeshLoader} from './mesh-loader';
import {Store3D} from './store-3d';

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
        Store3D,
        MeshLoader,
        MeshPreparationUtility
    ],
    exports: [
        MeshLoadingProgressBarComponent,
        ZoomButtonsComponent
    ]
})

export class Core3DModule {}
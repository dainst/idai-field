import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MeshLoadingProgressBarComponent} from './mesh-loading-progress-bar.component';
import {MeshLoadingProgress} from './mesh-loading-progress';
import {ZoomButtonsComponent} from './zoom-buttons.component';

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
        MeshLoadingProgress
    ],
    exports: [
        MeshLoadingProgressBarComponent,
        ZoomButtonsComponent
    ]
})

export class Core3DModule {}
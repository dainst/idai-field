import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MeshLoadingProgressBarComponent} from './mesh-loading-progress-bar.component';
import {MeshLoadingProgress} from './mesh-loading-progress';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule
    ],
    declarations: [
        MeshLoadingProgressBarComponent
    ],
    providers: [
        MeshLoadingProgress
    ],
    exports: [
        MeshLoadingProgressBarComponent
    ]
})

export class Core3DModule {}
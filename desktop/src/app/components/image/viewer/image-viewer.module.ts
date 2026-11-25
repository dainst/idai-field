import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { WidgetsModule } from '../../widgets/widgets.module';
import { ImageViewerComponent } from './image-viewer.component';
import { BrightnessSliderComponent } from './brightness-slider.component';


@NgModule({
    imports: [
        BrowserModule,
        WidgetsModule,
        NgbModule
    ],
    declarations: [
        ImageViewerComponent,
        BrightnessSliderComponent
    ],
    exports: [
        ImageViewerComponent
    ]
})

export class ImageViewerModule {}

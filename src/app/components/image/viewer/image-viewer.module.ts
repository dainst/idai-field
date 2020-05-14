import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ImageViewerComponent} from './image-viewer.component';


@NgModule({
    imports: [
        BrowserModule
    ],
    declarations: [
        ImageViewerComponent
    ],
    exports: [
        ImageViewerComponent
    ]
})

export class ImageViewerModule {}
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ImageDownloadModalComponent } from './image-download-modal.component';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule
    ],
    declarations: [
        ImageDownloadModalComponent
    ],
    exports: [
        ImageDownloadModalComponent
    ]
})

export class ImageDownloadModule {}

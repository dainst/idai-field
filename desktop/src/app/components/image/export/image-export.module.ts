import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ImageExportModalComponent } from './image-export-modal.component';
import { FormsModule } from '@angular/forms';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule
    ],
    declarations: [
        ImageExportModalComponent
    ],
    exports: [
        ImageExportModalComponent
    ]
})

export class ImageExportModule {}

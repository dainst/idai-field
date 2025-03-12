import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ImageExportModalComponent } from './image-export-modal.component';


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

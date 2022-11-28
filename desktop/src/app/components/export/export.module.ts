import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ExportComponent } from './export.component';
import { ExportModalComponent } from './export-modal.component';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule
    ],
    declarations: [
        ExportComponent,
        ExportModalComponent
    ],
    exports: [
        ExportComponent
    ],
    entryComponents: [
        ExportModalComponent
    ]
})

export class ExportModule {}

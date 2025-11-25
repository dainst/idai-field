import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ExportComponent } from './export.component';


@NgModule({
    imports: [
        BrowserModule,
        FormsModule
    ],
    declarations: [
        ExportComponent
    ],
    exports: [
        ExportComponent
    ]
})

export class ExportModule {}

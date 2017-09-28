import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {ExportComponent} from './export.component';
import {Exporter} from './exporter';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule
    ],
    declarations: [
        ExportComponent,
    ],
    exports: [
        ExportComponent
    ],
    providers: [
        Exporter
    ]
})

export class ExportModule {}
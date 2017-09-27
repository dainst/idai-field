import {NgModule} from '@angular/core';
import {ImportComponent} from './import.component';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {UploadModalComponent} from './upload-modal.component';
import {Importer} from './importer';
import {RelationsCompleter} from './relations-completer';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule
    ],
    declarations: [
        ImportComponent,
        UploadModalComponent
    ],
    exports: [
        ImportComponent
    ],
    entryComponents: [
        UploadModalComponent
    ],
    providers: [
        Importer,
        RelationsCompleter
    ]
})

export class ImportModule {}
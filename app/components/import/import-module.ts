import {NgModule} from '@angular/core';
import {ImportComponent} from './import.component';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {UploadModalComponent} from './upload-modal.component';

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
    ]
})

export class ImportModule {}
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {ImageUploader} from './image-uploader';
import {UploadStatus} from './upload-status';
import {UploadModalComponent} from './upload-modal.component';
import {ImageTypePickerModalComponent} from './image-type-picker-modal.component';

@NgModule({
    imports: [
        BrowserModule,
        IdaiWidgetsModule
    ],
    declarations: [
        UploadModalComponent,
        ImageTypePickerModalComponent
    ],
    entryComponents: [
        UploadModalComponent,
        ImageTypePickerModalComponent
    ],
    providers: [
        ImageUploader,
        UploadStatus
    ]
})

export class ImageUploadModule {}
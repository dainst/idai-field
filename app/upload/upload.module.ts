import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {ImageUploader} from './image/image-uploader';
import {UploadStatus} from './upload-status';
import {UploadModalComponent} from './upload-modal.component';
import {ImageTypePickerModalComponent} from './image/image-type-picker-modal.component';
import {Object3DUploader} from './object3d/object-3d-uploader';

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
        Object3DUploader,
        UploadStatus
    ]
})

export class UploadModule {}
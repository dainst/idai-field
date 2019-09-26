import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ImageUploader} from './image-uploader';
import {UploadStatus} from './upload-status';
import {UploadModalComponent} from './upload-modal.component';
import {ImageTypePickerModalComponent} from './image-type-picker-modal.component';
import {WidgetsModule} from '../../widgets/widgets.module';

@NgModule({
    imports: [
        BrowserModule,
        WidgetsModule
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